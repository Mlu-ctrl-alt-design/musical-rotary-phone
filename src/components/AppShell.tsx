import { Link, Outlet, useParams, useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, LayoutGrid, Settings } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'
import { Separator } from '@/components/ui/separator'

function Breadcrumb() {
  const { doctype, name } = useParams<{ doctype?: string; name?: string }>()
  const location = useLocation()
  const isNew = location.pathname.endsWith('/new')

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link
        to="/"
        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
      >
        <LayoutGrid className="h-4 w-4" />
        <span>Doctypes</span>
      </Link>

      {doctype && (
        <>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link
            to={`/doctype/${encodeURIComponent(doctype)}`}
            className="hover:text-foreground transition-colors truncate max-w-[200px]"
          >
            {doctype}
          </Link>
        </>
      )}

      {isNew && (
        <>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground">New</span>
        </>
      )}

      {name && !isNew && (
        <>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground truncate max-w-[200px]">{name}</span>
        </>
      )}
    </nav>
  )
}

export function AppShell() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            <LayoutGrid className="h-5 w-5" />
            <span className="hidden sm:inline">Doc Browser</span>
          </button>

          <Separator orientation="vertical" className="h-6" />

          <Breadcrumb />

          <Link
            to="/settings"
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="container py-6">
        <Outlet />
      </main>

      <Toaster />
    </div>
  )
}
