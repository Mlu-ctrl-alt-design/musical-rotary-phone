import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, TrendingUp, ChevronRight, AlertCircle } from 'lucide-react'
import { useAccessibleDoctypes } from '@/hooks/useDoctype'
import type { DoctypeListItem } from '@/api/types'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const VISITS_KEY = 'docbrowser:visits'
const MAX_RECENT = 5

function getVisits(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(VISITS_KEY) ?? '{}') as Record<string, number>
  } catch {
    return {}
  }
}

function incrementVisit(doctype: string) {
  const visits = getVisits()
  visits[doctype] = (visits[doctype] ?? 0) + 1
  localStorage.setItem(VISITS_KEY, JSON.stringify(visits))
}

function groupByModule(items: DoctypeListItem[]): Record<string, DoctypeListItem[]> {
  const groups: Record<string, DoctypeListItem[]> = {}
  for (const item of items) {
    const mod = item.module ?? 'Other'
    if (!groups[mod]) groups[mod] = []
    groups[mod].push(item)
  }
  return groups
}

interface DoctypeItemProps {
  name: string
  onClick: () => void
}

function DoctypeItem({ name, onClick }: DoctypeItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-between w-full px-3 py-2 rounded-md text-sm',
        'hover:bg-accent hover:text-accent-foreground transition-colors text-left'
      )}
    >
      <span className="truncate">{name}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

export function DoctypeSelector() {
  const navigate = useNavigate()
  const [search, setSearch] = React.useState('')
  const { data: doctypes = [], isLoading, error } = useAccessibleDoctypes()

  const visits = React.useMemo(() => getVisits(), [])

  const handleSelect = (doctype: string) => {
    incrementVisit(doctype)
    navigate(`/doctype/${encodeURIComponent(doctype)}`)
  }

  const filtered = React.useMemo(() => {
    if (!search.trim()) return doctypes
    const q = search.toLowerCase()
    return doctypes.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.module.toLowerCase().includes(q)
    )
  }, [doctypes, search])

  const frequent = React.useMemo(() => {
    return doctypes
      .filter((d) => (visits[d.name] ?? 0) > 0)
      .sort((a, b) => (visits[b.name] ?? 0) - (visits[a.name] ?? 0))
      .slice(0, MAX_RECENT)
  }, [doctypes, visits])

  const grouped = React.useMemo(() => groupByModule(filtered), [filtered])
  const moduleNames = Object.keys(grouped).sort()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Document Browser</h1>
        <p className="text-muted-foreground mt-1">Select a Doctype to browse its documents.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search Doctypes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading Doctypes...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load Doctypes. Please refresh the page.</span>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-6">
          {/* Frequent */}
          {frequent.length > 0 && !search && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Frequently used
                </h2>
              </div>
              <div className="rounded-md border bg-card p-1">
                {frequent.map((dt) => (
                  <DoctypeItem key={dt.name} name={dt.name} onClick={() => handleSelect(dt.name)} />
                ))}
              </div>
              <Separator className="mt-4" />
            </section>
          )}

          {/* Grouped list */}
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No Doctypes match &ldquo;{search}&rdquo;.
            </p>
          ) : (
            moduleNames.map((mod) => (
              <section key={mod}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {mod}
                </h2>
                <div className="rounded-md border bg-card p-1">
                  {grouped[mod].map((dt) => (
                    <DoctypeItem
                      key={dt.name}
                      name={dt.name}
                      onClick={() => handleSelect(dt.name)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  )
}
