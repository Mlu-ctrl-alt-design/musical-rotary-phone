import { describe, it, expect } from 'vitest'
import { serializeFilters, deserializeFilters, readListUrlState, buildListUrlParams } from '../filters'
import type { FrappeFilter } from '@/api/types'

describe('serializeFilters', () => {
  it('returns empty string for empty array', () => {
    expect(serializeFilters([])).toBe('')
  })

  it('serializes filters to JSON string', () => {
    const filters: FrappeFilter[] = [['status', '=', 'Draft']]
    const result = serializeFilters(filters)
    expect(result).toBe(JSON.stringify(filters))
  })

  it('handles multiple filters', () => {
    const filters: FrappeFilter[] = [
      ['status', '=', 'Draft'],
      ['amount', '>', '1000'],
    ]
    expect(JSON.parse(serializeFilters(filters))).toEqual(filters)
  })
})

describe('deserializeFilters', () => {
  it('returns empty array for null', () => {
    expect(deserializeFilters(null)).toEqual([])
  })

  it('returns empty array for invalid JSON', () => {
    expect(deserializeFilters('not-json')).toEqual([])
  })

  it('returns empty array for non-array JSON', () => {
    expect(deserializeFilters('{"key": "value"}')).toEqual([])
  })

  it('roundtrips filters correctly', () => {
    const filters: FrappeFilter[] = [['status', '=', 'Draft']]
    const serialized = serializeFilters(filters)
    expect(deserializeFilters(serialized)).toEqual(filters)
  })
})

describe('readListUrlState', () => {
  it('returns defaults for empty params', () => {
    const params = new URLSearchParams()
    const state = readListUrlState(params)
    expect(state.filters).toEqual([])
    expect(state.sort).toBe('modified desc')
    expect(state.page).toBe(1)
    expect(state.pageSize).toBe(20)
    expect(state.search).toBe('')
  })

  it('reads all values from params', () => {
    const params = new URLSearchParams({
      filters: JSON.stringify([['status', '=', 'Draft']]),
      sort: 'name asc',
      page: '3',
      pageSize: '50',
      q: 'hello',
    })
    const state = readListUrlState(params)
    expect(state.filters).toEqual([['status', '=', 'Draft']])
    expect(state.sort).toBe('name asc')
    expect(state.page).toBe(3)
    expect(state.pageSize).toBe(50)
    expect(state.search).toBe('hello')
  })

  it('enforces minimum page of 1', () => {
    const params = new URLSearchParams({ page: '0' })
    const state = readListUrlState(params)
    expect(state.page).toBe(1)
  })
})

describe('buildListUrlParams', () => {
  it('sets filter param', () => {
    const current = new URLSearchParams()
    const next = buildListUrlParams({ filters: [['status', '=', 'Draft']] }, current)
    expect(next.get('filters')).toBe(JSON.stringify([['status', '=', 'Draft']]))
  })

  it('removes filter param when empty', () => {
    const current = new URLSearchParams({ filters: '[[]]' })
    const next = buildListUrlParams({ filters: [] }, current)
    expect(next.has('filters')).toBe(false)
  })

  it('resets page when filters change', () => {
    const current = new URLSearchParams({ page: '3' })
    const next = buildListUrlParams({ filters: [] }, current)
    expect(next.has('page')).toBe(false)
  })

  it('removes page param when page is 1', () => {
    const current = new URLSearchParams({ page: '3' })
    const next = buildListUrlParams({ page: 1 }, current)
    expect(next.has('page')).toBe(false)
  })
})
