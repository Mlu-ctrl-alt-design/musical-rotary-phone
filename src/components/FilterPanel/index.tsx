import * as React from 'react'
import { X, Plus, Filter } from 'lucide-react'
import type { DoctypeField, FrappeFilter } from '@/api/types'
import {
  getOperatorsForFieldtype,
  operatorNeedsValue,
  type Operator,
} from '@/lib/filters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { isLayoutField } from '@/lib/fieldUtils'

interface FilterPanelProps {
  fields: DoctypeField[]
  filters: FrappeFilter[]
  onFiltersChange: (filters: FrappeFilter[]) => void
}

interface FilterRow {
  id: string
  fieldname: string
  operator: Operator
  value: string
}

function filtersToRows(filters: FrappeFilter[]): FilterRow[] {
  return filters.map((f, i) => ({
    id: String(i),
    fieldname: String(f[0]),
    operator: String(f[1]) as Operator,
    value: String(f[2] ?? ''),
  }))
}

function rowsToFilters(rows: FilterRow[]): FrappeFilter[] {
  return rows
    .filter((r) => r.fieldname)
    .map((r) => {
      const filter: FrappeFilter = [r.fieldname, r.operator, r.value]
      return filter
    })
}

let rowIdCounter = 0
function newRowId() {
  return `row-${++rowIdCounter}`
}

export function FilterPanel({ fields, filters, onFiltersChange }: FilterPanelProps) {
  const [open, setOpen] = React.useState(false)
  const [rows, setRows] = React.useState<FilterRow[]>(() => filtersToRows(filters))

  // Sync when external filters change (e.g. from URL)
  React.useEffect(() => {
    setRows(filtersToRows(filters))
  }, [filters])

  const editableFields = fields.filter(
    (f) => !isLayoutField(f.fieldtype) && !f.hidden
  )

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: newRowId(), fieldname: '', operator: '=', value: '' },
    ])
  }

  const removeRow = (id: string) => {
    const next = rows.filter((r) => r.id !== id)
    setRows(next)
    onFiltersChange(rowsToFilters(next))
  }

  const updateRow = (id: string, patch: Partial<FilterRow>) => {
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    setRows(next)
    onFiltersChange(rowsToFilters(next))
  }

  const activeCount = filters.length

  return (
    <div>
      {/* Filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {filters.map((f, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="flex items-center gap-1 text-xs pl-2 pr-1 py-1"
            >
              <span>
                {String(f[0])} {String(f[1])} {String(f[2] ?? '')}
              </span>
              <button
                onClick={() => {
                  const next = filters.filter((_, idx) => idx !== i)
                  onFiltersChange(next)
                }}
                className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                aria-label="Remove filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground px-2"
            onClick={() => onFiltersChange([])}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Toggle button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2"
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            {activeCount}
          </Badge>
        )}
      </Button>

      {/* Panel */}
      {open && (
        <div className="mt-3 rounded-md border bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium">Add Filters</h3>

          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground">No filters added yet.</p>
          )}

          <div className="space-y-2">
            {rows.map((row) => {
              const selectedField = editableFields.find((f) => f.fieldname === row.fieldname)
              const operators = selectedField
                ? getOperatorsForFieldtype(selectedField.fieldtype)
                : getOperatorsForFieldtype('Data')
              const needsValue = operatorNeedsValue(row.operator)

              return (
                <div key={row.id} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Field selector */}
                  <Select
                    value={row.fieldname}
                    onValueChange={(v) =>
                      updateRow(row.id, { fieldname: v, operator: '=', value: '' })
                    }
                  >
                    <SelectTrigger className="w-[180px] shrink-0">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {editableFields.map((f) => (
                        <SelectItem key={f.fieldname} value={f.fieldname}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Operator */}
                  <Select
                    value={row.operator}
                    onValueChange={(v) => updateRow(row.id, { operator: v as Operator, value: '' })}
                  >
                    <SelectTrigger className="w-[160px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value */}
                  {needsValue ? (
                    <Input
                      className="flex-1 min-w-[120px]"
                      value={row.value}
                      onChange={(e) => updateRow(row.id, { value: e.target.value })}
                      placeholder="Value"
                    />
                  ) : (
                    <div className="flex-1" />
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.id)}
                    className="shrink-0"
                    aria-label="Remove row"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>

          <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
            <Plus className="h-4 w-4" />
            Add filter
          </Button>
        </div>
      )}
    </div>
  )
}
