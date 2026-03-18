import type { FrappeFilter } from '@/api/types'

const FILTERS_PARAM = 'filters'
const SORT_PARAM = 'sort'
const PAGE_PARAM = 'page'
const PAGE_SIZE_PARAM = 'pageSize'
const SEARCH_PARAM = 'q'

// ─── Filter serialisation ─────────────────────────────────────────────────────

export function serializeFilters(filters: FrappeFilter[]): string {
  if (!filters.length) return ''
  return JSON.stringify(filters)
}

export function deserializeFilters(param: string | null): FrappeFilter[] {
  if (!param) return []
  try {
    const parsed = JSON.parse(param)
    if (!Array.isArray(parsed)) return []
    return parsed as FrappeFilter[]
  } catch {
    return []
  }
}

// ─── URL param helpers ────────────────────────────────────────────────────────

export interface ListUrlState {
  filters: FrappeFilter[]
  sort: string
  page: number
  pageSize: number
  search: string
}

export function readListUrlState(params: URLSearchParams, defaultSort = 'modified desc', defaultPageSize = 20): ListUrlState {
  return {
    filters: deserializeFilters(params.get(FILTERS_PARAM)),
    sort: params.get(SORT_PARAM) ?? defaultSort,
    page: Math.max(1, parseInt(params.get(PAGE_PARAM) ?? '1', 10)),
    pageSize: parseInt(params.get(PAGE_SIZE_PARAM) ?? String(defaultPageSize), 10),
    search: params.get(SEARCH_PARAM) ?? '',
  }
}

export function buildListUrlParams(state: Partial<ListUrlState>, current: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(current)

  if (state.filters !== undefined) {
    if (state.filters.length > 0) {
      next.set(FILTERS_PARAM, serializeFilters(state.filters))
    } else {
      next.delete(FILTERS_PARAM)
    }
    // Reset to page 1 when filters change
    next.delete(PAGE_PARAM)
  }

  if (state.sort !== undefined) {
    next.set(SORT_PARAM, state.sort)
    next.delete(PAGE_PARAM)
  }

  if (state.page !== undefined) {
    if (state.page === 1) {
      next.delete(PAGE_PARAM)
    } else {
      next.set(PAGE_PARAM, String(state.page))
    }
  }

  if (state.pageSize !== undefined) {
    next.set(PAGE_SIZE_PARAM, String(state.pageSize))
    next.delete(PAGE_PARAM)
  }

  if (state.search !== undefined) {
    if (state.search) {
      next.set(SEARCH_PARAM, state.search)
    } else {
      next.delete(SEARCH_PARAM)
    }
    next.delete(PAGE_PARAM)
  }

  return next
}

// ─── Operator definitions by field category ───────────────────────────────────

export type Operator =
  | '='
  | '!='
  | 'like'
  | 'not like'
  | 'in'
  | 'not in'
  | '>'
  | '>='
  | '<'
  | '<='
  | 'between'
  | 'is set'
  | 'is not set'

export interface OperatorOption {
  value: Operator
  label: string
}

const TEXT_OPERATORS: OperatorOption[] = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: 'like', label: 'contains' },
  { value: 'not like', label: 'does not contain' },
  { value: 'is set', label: 'is set' },
  { value: 'is not set', label: 'is not set' },
]

const NUMBER_OPERATORS: OperatorOption[] = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' },
  { value: '>=', label: 'greater than or equal' },
  { value: '<', label: 'less than' },
  { value: '<=', label: 'less than or equal' },
  { value: 'between', label: 'between' },
  { value: 'is set', label: 'is set' },
  { value: 'is not set', label: 'is not set' },
]

const SELECT_OPERATORS: OperatorOption[] = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: 'in', label: 'in' },
  { value: 'not in', label: 'not in' },
  { value: 'is set', label: 'is set' },
  { value: 'is not set', label: 'is not set' },
]

export function getOperatorsForFieldtype(fieldtype: string): OperatorOption[] {
  switch (fieldtype) {
    case 'Int':
    case 'Float':
    case 'Currency':
    case 'Percent':
    case 'Date':
    case 'Datetime':
      return NUMBER_OPERATORS
    case 'Select':
    case 'Link':
      return SELECT_OPERATORS
    default:
      return TEXT_OPERATORS
  }
}

export function operatorNeedsValue(op: Operator): boolean {
  return op !== 'is set' && op !== 'is not set'
}

export function operatorIsMultiValue(op: Operator): boolean {
  return op === 'in' || op === 'not in' || op === 'between'
}
