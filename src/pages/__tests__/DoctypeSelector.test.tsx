import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { DoctypeSelector } from '../DoctypeSelector'

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('DoctypeSelector', () => {
  it('renders the heading', () => {
    renderWithProviders(<DoctypeSelector />)
    expect(screen.getByText('Document Browser')).toBeInTheDocument()
  })

  it('renders the search input', () => {
    renderWithProviders(<DoctypeSelector />)
    expect(screen.getByPlaceholderText('Search Doctypes...')).toBeInTheDocument()
  })

  it('shows doctypes after loading', async () => {
    renderWithProviders(<DoctypeSelector />)
    await waitFor(() => {
      expect(screen.getByText('Test Doctype')).toBeInTheDocument()
    })
  })

  it('filters doctypes by search term', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DoctypeSelector />)

    await waitFor(() => {
      expect(screen.getByText('Test Doctype')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Search Doctypes...'), 'Sales')

    await waitFor(() => {
      expect(screen.getByText('Sales Invoice')).toBeInTheDocument()
      expect(screen.queryByText('Test Doctype')).not.toBeInTheDocument()
    })
  })
})
