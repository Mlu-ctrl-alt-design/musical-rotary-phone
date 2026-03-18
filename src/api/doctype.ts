import client from './client'
import type { DoctypeMeta, DoctypeListItem } from './types'

/**
 * Fetch full DocType meta (fields, permissions, etc.)
 * Uses the resource endpoint which returns the DocType document directly.
 */
export async function fetchDoctypeMeta(doctype: string): Promise<DoctypeMeta> {
  const response = await client.get<{ data: DoctypeMeta }>(
    `/api/resource/DocType/${encodeURIComponent(doctype)}`
  )
  return response.data.data
}

/**
 * Fetch all non-child Doctypes the current user can see.
 * The API enforces read permission server-side.
 */
export async function fetchAccessibleDoctypes(): Promise<DoctypeListItem[]> {
  const response = await client.get<{ data: DoctypeListItem[] }>('/api/resource/DocType', {
    params: {
      fields: JSON.stringify(['name', 'module']),
      filters: JSON.stringify([['istable', '=', 0]]),
      limit_page_length: 500,
      order_by: 'module asc, name asc',
    },
  })
  return response.data?.data ?? []
}
