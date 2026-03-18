import { z } from 'zod'
import type { DoctypeField } from '@/api/types'
import { isLayoutField } from './fieldUtils'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

function buildFieldSchema(field: DoctypeField): z.ZodTypeAny {
  const required = field.reqd === 1
  let schema: z.ZodTypeAny

  switch (field.fieldtype) {
    case 'Int':
      schema = z.union([z.number().int(), z.string().transform((v) => parseInt(v, 10))])
      break

    case 'Float':
    case 'Currency':
    case 'Percent':
      schema = z.union([z.number(), z.string().transform((v) => parseFloat(v))])
      break

    case 'Check':
      schema = z.union([z.boolean(), z.number().int().min(0).max(1)])
      break

    case 'Date':
      schema = z.string().regex(DATE_REGEX, 'Invalid date format (YYYY-MM-DD)')
      break

    case 'Datetime':
      schema = z.string().regex(DATETIME_REGEX, 'Invalid datetime format (YYYY-MM-DD HH:MM:SS)')
      break

    case 'Table':
      schema = z.array(z.record(z.unknown()))
      break

    case 'Select': {
      if (field.options) {
        const options = field.options
          .split('\n')
          .map((o) => o.trim())
          .filter(Boolean)
        if (options.length > 0) {
          schema = z.enum(options as [string, ...string[]])
          break
        }
      }
      schema = z.string()
      break
    }

    default:
      schema = z.string()
  }

  if (!required) {
    // Allow empty string or null/undefined for optional fields
    if (schema instanceof z.ZodString) {
      schema = schema.optional().or(z.literal(''))
    } else {
      schema = schema.optional().nullable()
    }
  } else {
    if (schema instanceof z.ZodString) {
      schema = (schema as z.ZodString).min(1, `${field.label} is required`)
    }
  }

  return schema
}

/**
 * Build a Zod schema from an array of DoctypeField definitions.
 * Only includes editable, non-layout, non-hidden fields.
 */
export function buildZodSchema(fields: DoctypeField[]): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {}

  for (const field of fields) {
    if (isLayoutField(field.fieldtype)) continue
    if (field.hidden) continue
    if (field.read_only) continue

    shape[field.fieldname] = buildFieldSchema(field)
  }

  return z.object(shape)
}
