import { type ControllerRenderProps, type FieldValues } from 'react-hook-form'
import type { DoctypeField } from '@/api/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ReadOnlyField } from './ReadOnlyField'
import { LinkField } from './LinkField'
import { DatePicker } from './DatePicker'
import { DatetimePicker } from './DatetimePicker'
import { cn } from '@/lib/utils'

interface FieldRendererProps {
  field: DoctypeField
  value: unknown
  onChange?: (value: unknown) => void
  readOnly?: boolean
  error?: string
  controllerField?: ControllerRenderProps<FieldValues>
}

function EditableField({
  field,
  value,
  onChange,
  controllerField,
}: FieldRendererProps & { readOnly?: false }) {
  const handlers = controllerField ?? {
    value: value ?? '',
    onChange: onChange ?? (() => {}),
    name: field.fieldname,
    onBlur: () => {},
    ref: () => {},
  }

  switch (field.fieldtype) {
    case 'Data':
    case 'Small Text':
    case 'Link': {
      if (field.fieldtype === 'Link' && field.options) {
        return (
          <LinkField
            value={String(handlers.value ?? '')}
            onChange={handlers.onChange}
            linkedDoctype={field.options}
            placeholder={`Search ${field.options}...`}
          />
        )
      }
      return (
        <Input
          {...handlers}
          value={String(handlers.value ?? '')}
          placeholder={field.label}
        />
      )
    }

    case 'Text':
    case 'Long Text':
    case 'Text Editor':
      return (
        <Textarea
          {...handlers}
          value={String(handlers.value ?? '')}
          placeholder={field.label}
          rows={4}
        />
      )

    case 'Int':
    case 'Float':
    case 'Currency':
    case 'Percent':
      return (
        <Input
          {...handlers}
          type="number"
          value={handlers.value === null || handlers.value === undefined ? '' : String(handlers.value)}
          onChange={(e) => {
            const v = e.target.value
            handlers.onChange(v === '' ? '' : Number(v))
          }}
          step={field.fieldtype === 'Int' ? 1 : 'any'}
          placeholder={field.label}
        />
      )

    case 'Date':
      return (
        <DatePicker
          value={String(handlers.value ?? '')}
          onChange={handlers.onChange}
        />
      )

    case 'Datetime':
      return (
        <DatetimePicker
          value={String(handlers.value ?? '')}
          onChange={handlers.onChange}
        />
      )

    case 'Select': {
      const options = field.options
        ? field.options
            .split('\n')
            .map((o) => o.trim())
            .filter(Boolean)
        : []
      return (
        <Select
          value={String(handlers.value ?? '')}
          onValueChange={handlers.onChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    case 'Check':
      return (
        <div className="flex items-center gap-2 h-10">
          <Checkbox
            checked={Boolean(handlers.value)}
            onCheckedChange={(checked) => handlers.onChange(checked ? 1 : 0)}
            id={field.fieldname}
          />
          <Label htmlFor={field.fieldname} className="font-normal cursor-pointer">
            {field.label}
          </Label>
        </div>
      )

    case 'Attach':
    case 'Attach Image':
      return <ReadOnlyField value={handlers.value} fieldtype={field.fieldtype} fieldname={field.fieldname} />

    default:
      return (
        <Input
          {...handlers}
          value={String(handlers.value ?? '')}
          placeholder={field.label}
        />
      )
  }
}

export function FieldRenderer({ field, value, onChange, readOnly, error, controllerField }: FieldRendererProps) {
  const isCheckField = field.fieldtype === 'Check'

  return (
    <div className="space-y-1.5">
      {/* Check fields render their own label inline */}
      {!isCheckField && (
        <Label
          htmlFor={field.fieldname}
          className={cn(
            'text-sm font-medium text-muted-foreground',
            field.reqd && !readOnly && 'after:content-["*"] after:ml-0.5 after:text-destructive'
          )}
        >
          {field.label}
        </Label>
      )}

      {readOnly ? (
        <ReadOnlyField value={value} fieldtype={field.fieldtype} fieldname={field.fieldname} />
      ) : (
        <EditableField
          field={field}
          value={value}
          onChange={onChange}
          controllerField={controllerField}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {field.description && !error && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  )
}
