// ─── Frappe field types ───────────────────────────────────────────────────────

export interface DoctypeField {
  name: string
  doctype: string
  fieldname: string
  fieldtype: string
  label: string
  reqd: 0 | 1
  hidden: 0 | 1
  read_only: 0 | 1
  in_list_view: 0 | 1
  in_filter: 0 | 1
  in_standard_filter: 0 | 1
  bold: 0 | 1
  options?: string
  default?: string
  description?: string
  idx: number
  search_index?: 0 | 1
  precision?: string
  collapsible?: 0 | 1
  collapsible_depends_on?: string
}

export interface DoctypeMeta {
  name: string
  module: string
  istable: 0 | 1
  is_submittable: 0 | 1
  title_field?: string
  search_fields?: string
  fields: DoctypeField[]
  permissions?: DoctypePermission[]
  allow_rename?: 0 | 1
}

export interface DoctypePermission {
  role: string
  read: 0 | 1
  write: 0 | 1
  create: 0 | 1
  delete: 0 | 1
  submit: 0 | 1
  cancel: 0 | 1
  amend: 0 | 1
}

export interface DoctypeListItem {
  name: string
  module: string
}

// ─── Document types ───────────────────────────────────────────────────────────

export interface FrappeDocument {
  name: string
  docstatus: 0 | 1 | 2
  doctype: string
  owner: string
  creation: string
  modified: string
  modified_by: string
  [key: string]: unknown
}

export type FrappeFilter = [string, string, string, unknown?]

export interface ListParams {
  fields?: string[]
  filters?: FrappeFilter[]
  or_filters?: FrappeFilter[]
  order_by?: string
  limit_start?: number
  limit_page_length?: number
  search?: string
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface FrappeListResponse<T = FrappeDocument> {
  data: T[]
}

export interface FrappeDocResponse<T = FrappeDocument> {
  data: T
}

// ─── Config types ─────────────────────────────────────────────────────────────

export interface DoctypeConfig {
  listColumns?: string[]
  defaultSort?: string
  defaultFilters?: FrappeFilter[]
}

export interface AppConfig {
  defaultPageSize: number
  theme: {
    primaryColor: string
    useUntitledUITokens?: boolean
  }
  doctypes: Record<string, DoctypeConfig>
}

// ─── Error types ─────────────────────────────────────────────────────────────

export class PermissionError extends Error {
  constructor(message?: string) {
    super(message ?? 'You do not have permission to perform this action')
    this.name = 'PermissionError'
  }
}

export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Document not found')
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends Error {
  fieldErrors?: Record<string, string>
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class NetworkError extends Error {
  constructor(message?: string) {
    super(message ?? 'Network error. Please check your connection.')
    this.name = 'NetworkError'
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please log in again.')
    this.name = 'SessionExpiredError'
  }
}
