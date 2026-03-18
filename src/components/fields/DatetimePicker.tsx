import { Input } from '@/components/ui/input'

interface DatetimePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

/**
 * Converts between Frappe datetime format (YYYY-MM-DD HH:MM:SS)
 * and the HTML datetime-local input format (YYYY-MM-DDTHH:MM).
 */
function toInputValue(frappeValue: string): string {
  if (!frappeValue) return ''
  // Replace space with T and trim seconds if present
  return frappeValue.replace(' ', 'T').slice(0, 16)
}

function toFrappeValue(inputValue: string): string {
  if (!inputValue) return ''
  // Replace T with space and append :00 seconds
  return inputValue.replace('T', ' ') + ':00'
}

export function DatetimePicker({ value, onChange, disabled, className }: DatetimePickerProps) {
  return (
    <Input
      type="datetime-local"
      value={toInputValue(value)}
      onChange={(e) => onChange(toFrappeValue(e.target.value))}
      disabled={disabled}
      className={className}
    />
  )
}
