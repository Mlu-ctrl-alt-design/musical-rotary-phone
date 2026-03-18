import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryCache, MutationCache, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/AppShell'
import { DoctypeSelector } from '@/pages/DoctypeSelector'
import { ListView } from '@/pages/ListView'
import { DetailView } from '@/pages/DetailView'
import { NewDocumentPage } from '@/pages/NewDocumentPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { toast } from '@/components/ui/use-toast'
import { PermissionError, NetworkError } from '@/api/types'

function handleQueryError(error: Error) {
  if (error instanceof PermissionError) {
    toast({
      title: 'Permission denied',
      description: error.message,
      variant: 'destructive',
    })
  } else if (error instanceof NetworkError) {
    toast({
      title: 'Network error',
      description: error.message,
      variant: 'destructive',
    })
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on permission or not-found errors
        if (error instanceof PermissionError) return false
        return failureCount < 1
      },
      staleTime: 30_000,
    },
  },
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleQueryError,
  }),
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DoctypeSelector />} />
            <Route path="/doctype/:doctype" element={<ListView />} />
            <Route path="/doctype/:doctype/new" element={<NewDocumentPage />} />
            <Route path="/doctype/:doctype/:name" element={<DetailView />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
