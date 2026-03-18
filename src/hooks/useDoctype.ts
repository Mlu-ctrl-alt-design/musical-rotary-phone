import { useQuery } from '@tanstack/react-query'
import { fetchDoctypeMeta, fetchAccessibleDoctypes } from '@/api/doctype'
import type { DoctypeListItem, DoctypeMeta } from '@/api/types'

/**
 * Fetch and cache DocType meta for the session.
 * staleTime: Infinity ensures it's never re-fetched automatically.
 */
export function useDoctypeMeta(doctype: string | undefined) {
  return useQuery<DoctypeMeta>({
    queryKey: ['doctype-meta', doctype],
    queryFn: () => fetchDoctypeMeta(doctype!),
    enabled: Boolean(doctype),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

/**
 * Fetch all accessible non-child Doctypes grouped by module.
 */
export function useAccessibleDoctypes() {
  return useQuery<DoctypeListItem[]>({
    queryKey: ['accessible-doctypes'],
    queryFn: fetchAccessibleDoctypes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
