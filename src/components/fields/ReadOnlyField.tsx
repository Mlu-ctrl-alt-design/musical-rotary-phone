import { formatFieldValue } from '@/lib/fieldUtils'

interface ReadOnlyFieldProps {
  value: unknown
  fieldtype: string
  fieldname: string
}

export function ReadOnlyField({ value, fieldtype, fieldname: _fieldname }: ReadOnlyFieldProps) {
  const displayed = formatFieldValue(value, fieldtype)

  if (fieldtype === 'Attach' || fieldtype === 'Attach Image') {
    if (!value || value === '') return <span className="text-muted-foreground">—</span>
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline-offset-4 hover:underline text-sm"
      >
        View attachment
      </a>
    )
  }

  if (fieldtype === 'Check') {
    return (
      <span className="text-sm">
        {value ? (
          <span className="text-green-600 font-medium">Yes</span>
        ) : (
          <span className="text-muted-foreground">No</span>
        )}
      </span>
    )
  }

  return (
    <span className="text-sm whitespace-pre-wrap break-words">
      {displayed === '—' ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        displayed
      )}
    </span>
  )
}
