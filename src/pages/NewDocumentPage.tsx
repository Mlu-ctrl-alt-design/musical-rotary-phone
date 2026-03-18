import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, X, AlertCircle } from 'lucide-react'
import { useDoctypeMeta } from '@/hooks/useDoctype'
import { useCreateDocument } from '@/hooks/useDocument'
import { buildZodSchema } from '@/lib/schemaBuilder'
import { buildDefaultValues, groupFieldsIntoSections, isLayoutField } from '@/lib/fieldUtils'
import { FieldRenderer } from '@/components/fields/FieldRenderer'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { ValidationError } from '@/api/types'
import type { DoctypeField } from '@/api/types'
import { cn } from '@/lib/utils'

function FieldGrid({ fields, errors, control }: {
  fields: DoctypeField[]
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

  return (
    <div className={cn('grid gap-4', columns.length > 1 ? `grid-cols-1 md:grid-cols-${Math.min(columns.length, 3)}` : 'grid-cols-1 md:grid-cols-2')}>
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
                  readOnly={false}
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

export function NewDocumentPage() {
  const { doctype } = useParams<{ doctype: string }>()
  const navigate = useNavigate()

  const { data: meta, isLoading: metaLoading, error: metaError } = useDoctypeMeta(doctype)
  const createMutation = useCreateDocument(doctype ?? '')

  const schema = React.useMemo(() => (meta ? buildZodSchema(meta.fields) : null), [meta])
  const defaultValues = React.useMemo(() => (meta ? buildDefaultValues(meta.fields) : {}), [meta])

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      const created = await createMutation.mutateAsync(data)
      toast({ title: 'Document created', variant: 'default' })
      navigate(`/doctype/${encodeURIComponent(doctype ?? '')}/${encodeURIComponent(created.name)}`)
    } catch (err) {
      if (err instanceof ValidationError) {
        toast({
          title: 'Validation error',
          description: err.message,
          variant: 'destructive',
        })
        if (err.fieldErrors) {
          for (const [field, msg] of Object.entries(err.fieldErrors)) {
            setError(field, { message: msg })
          }
        }
      } else {
        toast({
          title: 'Create failed',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'destructive',
        })
      }
    }
  }

  if (metaLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading form...</span>
      </div>
    )
  }

  if (metaError) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Failed to load Doctype metadata.</span>
      </div>
    )
  }

  if (!meta) return null

  const sections = groupFieldsIntoSections(meta.fields)

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold">New {doctype}</h1>
          <p className="text-sm text-muted-foreground">Fill in the fields below to create a new document.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Create
          </Button>
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
              errors={errors as Record<string, { message?: string }>}
              control={control}
            />
          </div>
        ))}
      </div>
    </form>
  )
}

