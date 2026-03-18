import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from '@/api/documents'
import type { FrappeDocument } from '@/api/types'

/**
 * Fetch a single document. Refetches on window focus.
 */
export function useDocument(doctype: string | undefined, name: string | undefined) {
  return useQuery<FrappeDocument>({
    queryKey: ['doc', doctype, name],
    queryFn: () => getDocument(doctype!, name!),
    enabled: Boolean(doctype) && Boolean(name),
    refetchOnWindowFocus: true,
  })
}

/**
 * Mutation: create a new document.
 * On success, invalidates the list query for the doctype.
 */
export function useCreateDocument(doctype: string) {
  const queryClient = useQueryClient()
  return useMutation<FrappeDocument, Error, Record<string, unknown>>({
    mutationFn: (data) => createDocument(doctype, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['list', doctype] })
    },
  })
}

/**
 * Mutation: update an existing document.
 * On success, invalidates both the list and the individual doc query.
 */
export function useUpdateDocument(doctype: string, name: string) {
  const queryClient = useQueryClient()
  return useMutation<FrappeDocument, Error, Record<string, unknown>>({
    mutationFn: (data) => updateDocument(doctype, name, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['doc', doctype, name], updated)
      void queryClient.invalidateQueries({ queryKey: ['list', doctype] })
    },
  })
}

/**
 * Mutation: delete a document.
 * On success, invalidates the list query.
 */
export function useDeleteDocument(doctype: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (name) => deleteDocument(doctype, name),
    onSuccess: (_data, name) => {
      queryClient.removeQueries({ queryKey: ['doc', doctype, name] })
      void queryClient.invalidateQueries({ queryKey: ['list', doctype] })
    },
  })
}
