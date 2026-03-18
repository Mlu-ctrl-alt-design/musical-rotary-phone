import client from './client'
import type { FrappeDocument, FrappeFilter, ListParams } from './types'

export interface ListResult {
  data: FrappeDocument[]
  total: number
}

/**
 * List documents for a given DocType with filtering, sorting, and pagination.
 */
export async function listDocuments(
  doctype: string,
  params: ListParams
): Promise<ListResult> {
  const { fields, filters, or_filters, order_by, limit_start, limit_page_length } = params

  const queryParams: Record<string, string | number> = {
    limit_page_length: limit_page_length ?? 20,
    limit_start: limit_start ?? 0,
  }

  if (fields?.length) {
    queryParams.fields = JSON.stringify(fields)
  }
  if (filters?.length) {
    queryParams.filters = JSON.stringify(filters)
  }
  if (or_filters?.length) {
    queryParams.or_filters = JSON.stringify(or_filters)
  }
  if (order_by) {
    queryParams.order_by = order_by
  }

  const [dataResponse, countResponse] = await Promise.all([
    client.get<{ data: FrappeDocument[] }>(`/api/resource/${encodeURIComponent(doctype)}`, {
      params: queryParams,
    }),
    client.get<{ message: number }>('/api/method/frappe.client.get_count', {
      params: {
        doctype,
        filters: filters?.length ? JSON.stringify(filters) : undefined,
      },
    }),
  ])

  return {
    data: dataResponse.data?.data ?? [],
    total: countResponse.data?.message ?? 0,
  }
}

/**
 * Fetch a single document by name.
 */
export async function getDocument(doctype: string, name: string): Promise<FrappeDocument> {
  const response = await client.get<{ data: FrappeDocument }>(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`
  )
  return response.data.data
}

/**
 * Create a new document.
 */
export async function createDocument(
  doctype: string,
  data: Record<string, unknown>
): Promise<FrappeDocument> {
  const response = await client.post<{ data: FrappeDocument }>(
    `/api/resource/${encodeURIComponent(doctype)}`,
    { ...data, doctype }
  )
  return response.data.data
}

/**
 * Update an existing document.
 */
export async function updateDocument(
  doctype: string,
  name: string,
  data: Record<string, unknown>
): Promise<FrappeDocument> {
  const response = await client.put<{ data: FrappeDocument }>(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    data
  )
  return response.data.data
}

/**
 * Delete a document.
 */
export async function deleteDocument(doctype: string, name: string): Promise<void> {
  await client.delete(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`
  )
}

/**
 * Search for linked document options (used by LinkField).
 */
export async function searchLink(
  doctype: string,
  query: string,
  referenceFilters?: FrappeFilter[]
): Promise<{ value: string; label: string }[]> {
  const params: Record<string, string> = {
    txt: query,
    doctype,
    ignore_user_permissions: '0',
    reference_doctype: '',
  }
  if (referenceFilters?.length) {
    params.filters = JSON.stringify(referenceFilters)
  }

  const response = await client.get<{ results: { value: string; description: string }[] }>(
    '/api/method/frappe.desk.search.search_link',
    { params }
  )

  return (response.data?.results ?? []).map((r) => ({
    value: r.value,
    label: r.description ? `${r.value} — ${r.description}` : r.value,
  }))
}
