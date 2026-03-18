import { describe, it, expect } from 'vitest'
import { buildZodSchema } from '../schemaBuilder'
import type { DoctypeField } from '@/api/types'

function makeField(overrides: Partial<DoctypeField>): DoctypeField {
  return {
    name: 'test_field',
    doctype: 'DocField',
    fieldname: 'test',
    fieldtype: 'Data',
    label: 'Test',
    reqd: 0,
    hidden: 0,
    read_only: 0,
    in_list_view: 0,
    in_filter: 0,
    in_standard_filter: 0,
    bold: 0,
    idx: 1,
    ...overrides,
  }
}

describe('buildZodSchema', () => {
  it('skips layout fields', () => {
    const fields = [
      makeField({ fieldname: 'sec', fieldtype: 'Section Break' }),
      makeField({ fieldname: 'title', fieldtype: 'Data' }),
    ]
    const schema = buildZodSchema(fields)
    const shape = schema.shape
    expect('sec' in shape).toBe(false)
    expect('title' in shape).toBe(true)
  })

  it('skips hidden fields', () => {
    const fields = [
      makeField({ fieldname: 'visible', fieldtype: 'Data', hidden: 0 }),
      makeField({ fieldname: 'hidden_field', fieldtype: 'Data', hidden: 1 }),
    ]
    const schema = buildZodSchema(fields)
    expect('hidden_field' in schema.shape).toBe(false)
    expect('visible' in schema.shape).toBe(true)
  })

  it('skips read-only fields', () => {
    const fields = [
      makeField({ fieldname: 'editable', fieldtype: 'Data', read_only: 0 }),
      makeField({ fieldname: 'readonly_field', fieldtype: 'Data', read_only: 1 }),
    ]
    const schema = buildZodSchema(fields)
    expect('readonly_field' in schema.shape).toBe(false)
    expect('editable' in schema.shape).toBe(true)
  })

  it('validates required Data fields', () => {
    const fields = [makeField({ fieldname: 'title', fieldtype: 'Data', reqd: 1 })]
    const schema = buildZodSchema(fields)

    const valid = schema.safeParse({ title: 'Hello' })
    expect(valid.success).toBe(true)

    const invalid = schema.safeParse({ title: '' })
    expect(invalid.success).toBe(false)
  })

  it('allows empty optional Data fields', () => {
    const fields = [makeField({ fieldname: 'notes', fieldtype: 'Data', reqd: 0 })]
    const schema = buildZodSchema(fields)

    const result = schema.safeParse({ notes: '' })
    expect(result.success).toBe(true)
  })

  it('validates Int fields', () => {
    const fields = [makeField({ fieldname: 'qty', fieldtype: 'Int', reqd: 1 })]
    const schema = buildZodSchema(fields)

    const valid = schema.safeParse({ qty: 5 })
    expect(valid.success).toBe(true)
  })

  it('validates Date fields', () => {
    const fields = [makeField({ fieldname: 'due_date', fieldtype: 'Date', reqd: 0 })]
    const schema = buildZodSchema(fields)

    const valid = schema.safeParse({ due_date: '2024-01-15' })
    expect(valid.success).toBe(true)

    const invalid = schema.safeParse({ due_date: 'not-a-date' })
    expect(invalid.success).toBe(false)
  })

  it('builds Select schema from options', () => {
    const fields = [
      makeField({
        fieldname: 'status',
        fieldtype: 'Select',
        options: 'Draft\nSubmitted\nCancelled',
        reqd: 0,
      }),
    ]
    const schema = buildZodSchema(fields)

    const valid = schema.safeParse({ status: 'Draft' })
    expect(valid.success).toBe(true)
  })
})
