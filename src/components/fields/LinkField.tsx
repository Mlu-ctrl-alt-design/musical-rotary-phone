import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn, debounce } from '@/lib/utils'
import { searchLink } from '@/api/documents'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface LinkFieldProps {
  value: string
  onChange: (value: string) => void
  linkedDoctype: string
  disabled?: boolean
  placeholder?: string
}

export function LinkField({
  value,
  onChange,
  linkedDoctype,
  disabled,
  placeholder,
}: LinkFieldProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value ?? '')
  const [searchTerm, setSearchTerm] = React.useState('')

  // Sync external value changes
  React.useEffect(() => {
    setInputValue(value ?? '')
  }, [value])

  const debouncedSearch = React.useMemo(
    () => debounce((term: string) => setSearchTerm(term), 300),
    []
  )

  const { data: options = [], isFetching } = useQuery({
    queryKey: ['link-search', linkedDoctype, searchTerm],
    queryFn: () => searchLink(linkedDoctype, searchTerm),
    enabled: open && Boolean(linkedDoctype),
    staleTime: 10_000,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInputValue(v)
    debouncedSearch(v)
    if (!open) setOpen(true)
  }

  const handleSelect = (optionValue: string) => {
    setInputValue(optionValue)
    onChange(optionValue)
    setOpen(false)
  }

  const handleBlur = () => {
    // If user typed something not in the list, clear or keep as-is
    // For now, keep the typed value
    if (inputValue !== value) {
      onChange(inputValue)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative flex items-center">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder ?? `Search ${linkedDoctype}...`}
            className="pr-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 h-full w-8 rounded-l-none opacity-60"
            disabled={disabled}
            tabIndex={-1}
          >
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
        {isFetching && (
          <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Searching...
          </div>
        )}
        {!isFetching && options.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No results found.</p>
        )}
        {!isFetching && options.length > 0 && (
          <ul className="max-h-64 overflow-auto py-1">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer',
                    value === option.value && 'bg-accent'
                  )}
                >
                  <Check
                    className={cn('h-4 w-4 shrink-0', value === option.value ? 'opacity-100' : 'opacity-0')}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
