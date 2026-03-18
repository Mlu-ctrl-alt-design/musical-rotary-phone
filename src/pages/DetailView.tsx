import * as React from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Edit2, Save, X, AlertCircle } from 'lucide-react'
import { useDoctypeMeta } from '@/hooks/useDoctype'
import { useDocument, useUpdateDocument } from '@/hooks/useDocument'
import { buildZodSchema } from '@/lib/schemaBuilder'
import { groupFieldsIntoSections, isLayoutField } from '@/lib/fieldUtils'
import { DocStatusBadge } from '@/components/DocStatusBadge'
import { FieldRenderer } from '@/components/fields/FieldRenderer'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import type { DoctypeField } from '@/api/types'
import { ValidationError, NotFoundError } from '@/api/types'
import { cn } from '@/lib/utils'

function FieldGrid({ fields, readOnly, errors, control }: {
  fields: DoctypeField[]
  readOnly: boolean
  errors: Record<string, { message?: string }>
  control: ReturnType<typeof useForm>['control']
}) {
  const renderable = fields.filter((f) => !isLayoutField(f.fieldtype) || f.fieldtype === 'Column Break')
  const columns: DoctypeField[][] = [[]]
  let currentCol = 0

  for (const field of renderable) {
    if (field.fieldtype === 'Column Break') {
      currentCol++
      columns[currentCol] = []
    } else {
      columns[currentCol].push(field)
    }
  }

  if (columns.length === 1) {
    // Single column — render in a 2-col grid
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {columns[0].map((field) => (
          <Controller
            key={field.fieldname}
            name={field.fieldname}
            control={control}
            render={({ field: controllerField }) => (
              <FieldRenderer
                field={field}
                value={controllerField.value as unknown}
                readOnly={readOnly}
                error={errors[field.fieldname]?.message}
                controllerField={controllerField}
              />
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4', `grid-cols-1 md:grid-cols-${Math.min(columns.length, 3)}`)}>
      {columns.map((col, i) => (
        <div key={i} className="space-y-4">
          {col.map((field) => (
            <Controller
              key={field.fieldname}
              name={field.fieldname}
              control={control}
              render={({ field: controllerField }) => (
                <FieldRenderer
                  field={field}
                  value={controllerField.value as unknown}
                  readOnly={readOnly}
                  error={errors[field.fieldname]?.message}
                  controllerField={controllerField}
                />
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function DetailView() {
  const { doctype, name } = useParams<{ doctype: string; name: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const isEditMode = searchParams.get('mode') === 'edit'
  const [editing, setEditing] = React.useState(isEditMode)

  const { data: meta, isLoading: metaLoading } = useDoctypeMeta(doctype)
  const { data: document, isLoading: docLoading, error: docError } = useDocument(doctype, name)
  const updateMutation = useUpdateDocument(doctype ?? '', name ?? '')

  const schema = React.useMemo(() => {
    if (!meta) return null
    return buildZodSchema(meta.fields)
  }, [meta])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: document as Record<string, unknown> ?? {},
  })

  // Reset form when document loads
  React.useEffect(() => {
    if (document) {
      reset(document as Record<string, unknown>)
    }
  }, [document, reset])

  const isReadOnly = !editing || document?.docstatus !== 0

  const handleEdit = () => {
    setEditing(true)
    setSearchParams({ mode: 'edit' })
  }

  const handleDiscard = () => {
    setEditing(false)
    setSearchParams({})
    reset(document as Record<string, unknown>)
  }

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      await updateMutation.mutateAsync(data)
      setEditing(false)
      setSearchParams({})
      toast({ title: 'Document saved', variant: 'default' })
    } catch (err) {
      if (err instanceof ValidationError) {
        toast({
          title: 'Validation error',
          description: err.message,
          variant: 'destructive',
        })
        // Map field errors if available
        if (err.fieldErrors) {
          for (const [field, msg] of Object.entries(err.fieldErrors)) {
            setError(field, { message: msg })
          }
        }
      } else {
        toast({
          title: 'Save failed',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'destructive',
        })
      }
    }
  }

  const isLoading = metaLoading || docLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  if (docError instanceof NotFoundError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <AlertCircle className="h-8 w-8" />
        <p className="text-lg font-medium">Document not found</p>
        <p className="text-sm">{name} does not exist or you do not have access.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    )
  }

  if (docError) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Failed to load document.</span>
      </div>
    )
  }

  if (!document || !meta) return null

  const sections = groupFieldsIntoSections(meta.fields)
  const canEdit = document.docstatus === 0

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold break-all">{name}</h1>
            {meta.is_submittable ? <DocStatusBadge docstatus={document.docstatus} /> : null}
          </div>
          {document.modified && (
            <p className="text-sm text-muted-foreground">
              Last modified: {new Date(String(document.modified)).toLocaleString()}
              {document.modified_by ? ` by ${String(document.modified_by)}` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canEdit && !editing && (
            <Button type="button" onClick={handleEdit} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}

          {editing && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleDiscard}
                disabled={isSubmitting}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Discard
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Field sections */}
      <div className="space-y-8">
        {sections.map((section, i) => (
          <div key={i} className="space-y-4">
            {section.label && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {section.label}
                </h2>
                <Separator className="mt-2" />
              </div>
            )}

            <FieldGrid
              fields={section.fields}
              readOnly={isReadOnly}
              errors={errors as Record<string, { message?: string }>}
              control={control}
            />
          </div>
        ))}
      </div>
    </form>
  )
}
