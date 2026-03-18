import type { DoctypeField } from '@/api/types'

// ─── Layout field detection ────────────────────────────────────────────────────

const LAYOUT_FIELDTYPES = new Set([
  'Section Break',
  'Column Break',
  'HTML',
  'Heading',
  'Tab Break',
  'Fold',
  'Button',
])

export function isLayoutField(fieldtype: string): boolean {
  return LAYOUT_FIELDTYPES.has(fieldtype)
}

// ─── Always read-only field types ─────────────────────────────────────────────

const ALWAYS_READONLY_FIELDTYPES = new Set([
  'Attach',
  'Attach Image',
  'HTML',
  'Heading',
])

export function isAlwaysReadOnly(fieldtype: string): boolean {
  return ALWAYS_READONLY_FIELDTYPES.has(fieldtype)
}

// ─── Numeric field types ───────────────────────────────────────────────────────

const NUMERIC_FIELDTYPES = new Set(['Int', 'Float', 'Currency', 'Percent'])

export function isNumericField(fieldtype: string): boolean {
  return NUMERIC_FIELDTYPES.has(fieldtype)
}

// ─── Date field types ──────────────────────────────────────────────────────────

export function isDateField(fieldtype: string): boolean {
  return fieldtype === 'Date' || fieldtype === 'Datetime'
}

// ─── Default values by fieldtype ──────────────────────────────────────────────

export function getDefaultValue(field: DoctypeField): unknown {
  if (field.default !== undefined && field.default !== '') {
    // Handle dynamic defaults
    if (field.default === 'Today') return new Date().toISOString().slice(0, 10)
    if (field.default === 'Now') return new Date().toISOString().slice(0, 19).replace('T', ' ')
    return field.default
  }

  switch (field.fieldtype) {
    case 'Int':
    case 'Float':
    case 'Currency':
    case 'Percent':
      return 0
    case 'Check':
      return 0
    case 'Table':
      return []
    default:
      return ''
  }
}

// ─── Build default form values from DocType meta ──────────────────────────────

export function buildDefaultValues(fields: DoctypeField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const field of fields) {
    if (isLayoutField(field.fieldtype)) continue
    if (field.hidden) continue
    values[field.fieldname] = getDefaultValue(field)
  }
  return values
}

// ─── Visible fields for list view ─────────────────────────────────────────────

export function getListViewFields(fields: DoctypeField[], maxFields = 5): string[] {
  const visible = fields
    .filter((f) => f.in_list_view && !isLayoutField(f.fieldtype) && !f.hidden)
    .sort((a, b) => a.idx - b.idx)
    .slice(0, maxFields)
    .map((f) => f.fieldname)

  return visible.length > 0 ? visible : ['name', 'modified', 'owner']
}

// ─── Group fields into sections ────────────────────────────────────────────────

export interface FieldSection {
  label: string
  fields: DoctypeField[]
  collapsible: boolean
}

export function groupFieldsIntoSections(fields: DoctypeField[]): FieldSection[] {
  const sections: FieldSection[] = []
  let current: FieldSection = { label: '', fields: [], collapsible: false }

  for (const field of fields) {
    if (field.hidden) continue

    if (field.fieldtype === 'Section Break') {
      if (current.fields.length > 0) {
        sections.push(current)
      }
      current = {
        label: field.label ?? '',
        fields: [],
        collapsible: Boolean(field.collapsible),
      }
      continue
    }

    if (field.fieldtype === 'Column Break') {
      // Column breaks are handled within a section — mark with a special sentinel
      current.fields.push(field)
      continue
    }

    if (isLayoutField(field.fieldtype)) continue

    current.fields.push(field)
  }

  if (current.fields.length > 0) {
    sections.push(current)
  }

  return sections
}

// ─── Format a field value for display ─────────────────────────────────────────

export function formatFieldValue(value: unknown, fieldtype: string): string {
  if (value === null || value === undefined || value === '') return '—'

  switch (fieldtype) {
    case 'Check':
      return value ? 'Yes' : 'No'
    case 'Currency':
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value))
    case 'Percent':
      return `${Number(value).toFixed(2)}%`
    case 'Date': {
      try {
        return new Date(String(value)).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      } catch {
        return String(value)
      }
    }
    case 'Datetime': {
      try {
        return new Date(String(value)).toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch {
        return String(value)
      }
    }
    case 'Table':
      return Array.isArray(value) ? `${(value as unknown[]).length} rows` : '—'
    default:
      return String(value)
  }
}
