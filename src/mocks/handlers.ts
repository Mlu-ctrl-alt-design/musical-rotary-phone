import { http, HttpResponse } from 'msw'

const MOCK_DOCTYPE_META = {
  name: 'Test Doctype',
  module: 'Test Module',
  istable: 0,
  is_submittable: 1,
  title_field: 'title',
  search_fields: 'title,name',
  fields: [
    {
      name: 'field_title',
      doctype: 'DocField',
      fieldname: 'title',
      fieldtype: 'Data',
      label: 'Title',
      reqd: 1,
      hidden: 0,
      read_only: 0,
      in_list_view: 1,
      in_filter: 1,
      in_standard_filter: 1,
      bold: 0,
      idx: 1,
    },
    {
      name: 'field_status',
      doctype: 'DocField',
      fieldname: 'status',
      fieldtype: 'Select',
      label: 'Status',
      options: 'Draft\nSubmitted\nCancelled',
      reqd: 0,
      hidden: 0,
      read_only: 0,
      in_list_view: 1,
      in_filter: 1,
      in_standard_filter: 1,
      bold: 0,
      idx: 2,
    },
    {
      name: 'field_amount',
      doctype: 'DocField',
      fieldname: 'amount',
      fieldtype: 'Currency',
      label: 'Amount',
      reqd: 0,
      hidden: 0,
      read_only: 0,
      in_list_view: 1,
      in_filter: 0,
      in_standard_filter: 0,
      bold: 0,
      idx: 3,
    },
  ],
  permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1, submit: 1, cancel: 1, amend: 1 }],
}

const MOCK_DOCUMENTS = [
  {
    name: 'TEST-001',
    doctype: 'Test Doctype',
    docstatus: 0,
    owner: 'admin@example.com',
    creation: '2024-01-01 00:00:00',
    modified: '2024-01-15 10:30:00',
    modified_by: 'admin@example.com',
    title: 'First Test Document',
    status: 'Draft',
    amount: 1000,
  },
  {
    name: 'TEST-002',
    doctype: 'Test Doctype',
    docstatus: 1,
    owner: 'admin@example.com',
    creation: '2024-01-02 00:00:00',
    modified: '2024-01-16 14:00:00',
    modified_by: 'admin@example.com',
    title: 'Second Test Document',
    status: 'Submitted',
    amount: 2500,
  },
]

export const handlers = [
  // DocType meta
  http.get('/api/resource/DocType/:doctype', ({ params }) => {
    const { doctype } = params
    if (doctype === 'Test%20Doctype' || doctype === 'Test Doctype') {
      return HttpResponse.json({ data: MOCK_DOCTYPE_META })
    }
    return HttpResponse.json({ data: null }, { status: 404 })
  }),

  // DocType list (for selector)
  http.get('/api/resource/DocType', () => {
    return HttpResponse.json({
      data: [
        { name: 'Test Doctype', module: 'Test Module' },
        { name: 'Sales Invoice', module: 'Accounts' },
        { name: 'Purchase Order', module: 'Buying' },
      ],
    })
  }),

  // Document list
  http.get('/api/resource/:doctype', ({ params }) => {
    const { doctype } = params
    if (doctype === 'Test%20Doctype' || doctype === 'Test Doctype') {
      return HttpResponse.json({ data: MOCK_DOCUMENTS })
    }
    return HttpResponse.json({ data: [] })
  }),

  // Document count
  http.get('/api/method/frappe.client.get_count', () => {
    return HttpResponse.json({ message: 2 })
  }),

  // Single document
  http.get('/api/resource/:doctype/:name', ({ params }) => {
    const { name } = params
    const doc = MOCK_DOCUMENTS.find((d) => d.name === name)
    if (doc) return HttpResponse.json({ data: doc })
    return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
  }),

  // Create document
  http.post('/api/resource/:doctype', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const newDoc = {
      ...body,
      name: 'TEST-NEW-001',
      docstatus: 0,
      owner: 'admin@example.com',
      creation: new Date().toISOString(),
      modified: new Date().toISOString(),
      modified_by: 'admin@example.com',
    }
    return HttpResponse.json({ data: newDoc }, { status: 200 })
  }),

  // Update document
  http.put('/api/resource/:doctype/:name', async ({ params, request }) => {
    const { name } = params
    const body = await request.json() as Record<string, unknown>
    const doc = MOCK_DOCUMENTS.find((d) => d.name === name)
    if (!doc) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
    const updated = { ...doc, ...body, modified: new Date().toISOString() }
    return HttpResponse.json({ data: updated })
  }),

  // Delete document
  http.delete('/api/resource/:doctype/:name', ({ params }) => {
    const { name } = params
    const exists = MOCK_DOCUMENTS.some((d) => d.name === name)
    if (!exists) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
    return HttpResponse.json({ message: 'ok' })
  }),

  // Search link
  http.get('/api/method/frappe.desk.search.search_link', ({ request }) => {
    const url = new URL(request.url)
    const txt = url.searchParams.get('txt') ?? ''
    const results = MOCK_DOCUMENTS
      .filter((d) => d.name.includes(txt) || d.title.includes(txt))
      .map((d) => ({ value: d.name, description: d.title }))
    return HttpResponse.json({ results })
  }),
]
