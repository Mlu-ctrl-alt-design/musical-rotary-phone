import { Input } from '@/components/ui/input'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function DatePicker({ value, onChange, disabled, className }: DatePickerProps) {
  return (
    <Input
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className}
    />
  )
}
