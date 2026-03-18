import { Plus, Trash2 } from 'lucide-react'
import type { DoctypeField } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { isLayoutField } from '@/lib/fieldUtils'

interface ChildTableProps {
  childFields: DoctypeField[]
  value: Record<string, unknown>[]
  onChange: (rows: Record<string, unknown>[]) => void
  readOnly?: boolean
  childDoctype: string
}

let rowCounter = 0
function newRowId() {
  return `new-row-${++rowCounter}`
}

export function ChildTable({
  childFields,
  value = [],
  onChange,
  readOnly,
}: ChildTableProps) {
  const visibleFields = childFields.filter(
    (f) => !isLayoutField(f.fieldtype) && !f.hidden && f.fieldname !== 'name'
  ).slice(0, 6) // Show max 6 columns to avoid overflow

  const addRow = () => {
    const newRow: Record<string, unknown> = { __islocal: true, __id: newRowId() }
    for (const f of visibleFields) {
      newRow[f.fieldname] = ''
    }
    onChange([...value, newRow])
  }

  const removeRow = (index: number) => {
    const next = value.filter((_, i) => i !== index)
    onChange(next)
  }

  const updateCell = (index: number, fieldname: string, cellValue: unknown) => {
    const next = value.map((row, i) =>
      i === index ? { ...row, [fieldname]: cellValue } : row
    )
    onChange(next)
  }

  if (visibleFields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Child table fields not available.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              {visibleFields.map((f) => (
                <TableHead key={f.fieldname}>{f.label}</TableHead>
              ))}
              {!readOnly && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {value.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleFields.length + (readOnly ? 1 : 2)}
                  className="text-center text-muted-foreground text-sm h-16"
                >
                  No rows
                </TableCell>
              </TableRow>
            ) : (
              value.map((row, index) => (
                <TableRow key={String(row.name ?? row.__id ?? index)}>
                  <TableCell className="text-center text-muted-foreground text-xs">
                    {index + 1}
                  </TableCell>
                  {visibleFields.map((f) => (
                    <TableCell key={f.fieldname}>
                      {readOnly ? (
                        <span className="text-sm">{String(row[f.fieldname] ?? '—')}</span>
                      ) : (
                        <Input
                          value={String(row[f.fieldname] ?? '')}
                          onChange={(e) => updateCell(index, f.fieldname, e.target.value)}
                          className="h-8 text-sm"
                          placeholder={f.label}
                        />
                      )}
                    </TableCell>
                  ))}
                  {!readOnly && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeRow(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-2">
          <Plus className="h-4 w-4" />
          Add row
        </Button>
      )}
    </div>
  )
}
