import * as React from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import {
  Loader2,
  Plus,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  AlertCircle,
  Search,
} from 'lucide-react'
import { useDoctypeMeta } from '@/hooks/useDoctype'
import { useDocumentList } from '@/hooks/useDocumentList'
import { useDeleteDocument } from '@/hooks/useDocument'
import { readListUrlState, buildListUrlParams } from '@/lib/filters'
import { getListViewFields, formatFieldValue } from '@/lib/fieldUtils'
import { debounce } from '@/lib/utils'
import { FilterPanel } from '@/components/FilterPanel'
import { DocStatusBadge } from '@/components/DocStatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import type { FrappeDocument, FrappeFilter } from '@/api/types'
import config from '@/config/docbrowser.config.json'
import type { AppConfig } from '@/api/types'

const appConfig = config as unknown as AppConfig

function SortIcon({ field, sort }: { field: string; sort: string }) {
  const [sortField, sortDir] = sort.split(' ')
  if (sortField !== field) return <ChevronsUpDown className="h-4 w-4 opacity-40 ml-1" />
  if (sortDir === 'asc') return <ChevronUp className="h-4 w-4 ml-1" />
  return <ChevronDown className="h-4 w-4 ml-1" />
}

interface DeleteDialogProps {
  name: string | null
  doctype: string
  onClose: () => void
}

function DeleteDialog({ name, doctype, onClose }: DeleteDialogProps) {
  const deleteMutation = useDeleteDocument(doctype)

  const handleDelete = async () => {
    if (!name) return
    try {
      await deleteMutation.mutateAsync(name)
      toast({ title: 'Document deleted', variant: 'default' })
      onClose()
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={Boolean(name)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete document?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ListView() {
  const { doctype } = useParams<{ doctype: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const doctypeConfig = appConfig.doctypes?.[doctype ?? '']
  const defaultSort = doctypeConfig?.defaultSort ?? 'modified desc'
  const defaultFilters = (doctypeConfig?.defaultFilters ?? []) as FrappeFilter[]
  const defaultPageSize = appConfig.defaultPageSize ?? 20

  const urlState = readListUrlState(searchParams, defaultSort, defaultPageSize)
  const [localSearch, setLocalSearch] = React.useState(urlState.search)
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null)

  const { data: meta, isLoading: metaLoading, error: metaError } = useDoctypeMeta(doctype)

  const columns = React.useMemo(() => {
    if (!meta) return ['name', 'modified', 'owner']
    if (doctypeConfig?.listColumns?.length) return doctypeConfig.listColumns
    const fromMeta = getListViewFields(meta.fields, 5)
    return fromMeta.length ? fromMeta : ['name', 'modified', 'owner']
  }, [meta, doctypeConfig])

  const searchFields = React.useMemo(() => {
    if (!meta?.search_fields) return ['name']
    return meta.search_fields.split(',').map((s) => s.trim()).filter(Boolean)
  }, [meta])

  const activeFilters = React.useMemo(() => {
    const url = urlState.filters
    return url.length ? url : defaultFilters
  }, [urlState.filters, defaultFilters])

  const { data: listData, isLoading, isFetching, error: listError } = useDocumentList(
    doctype,
    {
      fields: columns,
      filters: activeFilters,
      sort: urlState.sort,
      page: urlState.page,
      pageSize: urlState.pageSize,
      search: urlState.search,
      searchFields,
    }
  )

  const documents = listData?.data ?? []
  const total = listData?.total ?? 0
  const totalPages = Math.ceil(total / urlState.pageSize)

  const debouncedSearch = React.useMemo(
    () =>
      debounce((value: string) => {
        setSearchParams(buildListUrlParams({ search: value }, searchParams))
      }, 300),
    [searchParams, setSearchParams]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value)
    debouncedSearch(e.target.value)
  }

  const handleSort = (field: string) => {
    const [currentField, currentDir] = urlState.sort.split(' ')
    const newDir = currentField === field && currentDir === 'desc' ? 'asc' : 'desc'
    setSearchParams(buildListUrlParams({ sort: `${field} ${newDir}` }, searchParams))
  }

  const handleFiltersChange = (filters: FrappeFilter[]) => {
    setSearchParams(buildListUrlParams({ filters }, searchParams))
  }

  const handlePage = (page: number) => {
    setSearchParams(buildListUrlParams({ page }, searchParams))
  }

  const handlePageSize = (size: string) => {
    setSearchParams(buildListUrlParams({ pageSize: parseInt(size, 10) }, searchParams))
  }

  if (metaLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading {doctype}...</span>
      </div>
    )
  }

  if (metaError) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Failed to load Doctype metadata.</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{doctype}</h1>
          <p className="text-sm text-muted-foreground">
            {total > 0 ? `${total} record${total !== 1 ? 's' : ''}` : 'No records'}
          </p>
        </div>
        <Button onClick={() => navigate(`/doctype/${encodeURIComponent(doctype ?? '')}/new`)} className="gap-2">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search..."
            value={localSearch}
            onChange={handleSearchChange}
          />
        </div>

        {meta && (
          <FilterPanel
            fields={meta.fields}
            filters={activeFilters}
            onFiltersChange={handleFiltersChange}
          />
        )}
      </div>

      {/* Error */}
      {listError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load documents.</span>
        </div>
      )}

      {/* Table */}
      <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col}>
                    <button
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort(col)}
                    >
                      {meta?.fields.find((f) => f.fieldname === col)?.label ?? col}
                      <SortIcon field={col} sort={urlState.sort} />
                    </button>
                  </TableHead>
                ))}
                {meta?.is_submittable ? <TableHead>Status</TableHead> : null}
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (meta?.is_submittable ? 2 : 1)}
                    className="h-24 text-center text-muted-foreground"
                  >
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (meta?.is_submittable ? 2 : 1)}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No documents found.
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc: FrappeDocument) => (
                  <TableRow key={doc.name} className="cursor-pointer group">
                    {columns.map((col) => {
                      const field = meta?.fields.find((f) => f.fieldname === col)
                      return (
                        <TableCell key={col} className="max-w-[200px]">
                          <Link
                            to={`/doctype/${encodeURIComponent(doctype ?? '')}/${encodeURIComponent(doc.name)}`}
                            className="block truncate"
                          >
                            {formatFieldValue(doc[col], field?.fieldtype ?? 'Data')}
                          </Link>
                        </TableCell>
                      )
                    })}

                    {meta?.is_submittable ? (
                      <TableCell>
                        <DocStatusBadge docstatus={doc.docstatus} />
                      </TableCell>
                    ) : null}

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link
                            to={`/doctype/${encodeURIComponent(doctype ?? '')}/${encodeURIComponent(doc.name)}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(doc.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <Select value={String(urlState.pageSize)} onValueChange={handlePageSize}>
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {urlState.page} of {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={urlState.page <= 1}
              onClick={() => handlePage(urlState.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={urlState.page >= totalPages}
              onClick={() => handlePage(urlState.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <DeleteDialog
        name={deleteTarget}
        doctype={doctype ?? ''}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
