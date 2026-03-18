import { useQuery } from '@tanstack/react-query'
import { listDocuments } from '@/api/documents'
import type { FrappeDocument, FrappeFilter } from '@/api/types'

export interface UseDocumentListParams {
  fields?: string[]
  filters?: FrappeFilter[]
  sort?: string
  page?: number
  pageSize?: number
  search?: string
  searchFields?: string[]
  enabled?: boolean
}

export interface DocumentListResult {
  data: FrappeDocument[]
  total: number
}

export function useDocumentList(doctype: string | undefined, params: UseDocumentListParams) {
  const {
    fields,
    filters = [],
    sort = 'modified desc',
    page = 1,
    pageSize = 20,
    search = '',
    searchFields = [],
    enabled = true,
  } = params

  const orFilters: FrappeFilter[] = []
  if (search && searchFields.length > 0) {
    for (const sf of searchFields) {
      orFilters.push([sf, 'like', `%${search}%`])
    }
  }

  const [sortField, sortDir] = sort.split(' ')
  const order_by = sortDir ? `${sortField} ${sortDir}` : sort

  return useQuery<DocumentListResult>({
    queryKey: ['list', doctype, filters, orFilters, order_by, page, pageSize],
    queryFn: () =>
      listDocuments(doctype!, {
        fields: fields?.length ? ['name', ...fields.filter((f) => f !== 'name')] : undefined,
        filters,
        or_filters: orFilters.length > 0 ? orFilters : undefined,
        order_by,
        limit_start: (page - 1) * pageSize,
        limit_page_length: pageSize,
      }),
    enabled: Boolean(doctype) && enabled,
    placeholderData: (prev) => prev,
  })
}
