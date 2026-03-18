import { describe, it, expect } from 'vitest'
import { listDocuments, getDocument, createDocument, updateDocument, deleteDocument } from '../documents'

describe('listDocuments', () => {
  it('fetches documents with default params', async () => {
    const result = await listDocuments('Test Doctype', {})
    expect(result.data).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.data[0].name).toBe('TEST-001')
  })
})

describe('getDocument', () => {
  it('fetches a single document by name', async () => {
    const doc = await getDocument('Test Doctype', 'TEST-001')
    expect(doc.name).toBe('TEST-001')
    expect(doc.docstatus).toBe(0)
  })

  it('throws NotFoundError for missing document', async () => {
    await expect(getDocument('Test Doctype', 'DOES-NOT-EXIST')).rejects.toThrow()
  })
})

describe('createDocument', () => {
  it('creates a document and returns it with a name', async () => {
    const doc = await createDocument('Test Doctype', { title: 'New Doc', status: 'Draft' })
    expect(doc.name).toBeTruthy()
    expect(doc.title).toBe('New Doc')
  })
})

describe('updateDocument', () => {
  it('updates a document and returns the updated version', async () => {
    const doc = await updateDocument('Test Doctype', 'TEST-001', { title: 'Updated Title' })
    expect(doc.title).toBe('Updated Title')
  })
})

describe('deleteDocument', () => {
  it('deletes an existing document without error', async () => {
    await expect(deleteDocument('Test Doctype', 'TEST-001')).resolves.not.toThrow()
  })

  it('throws for missing document', async () => {
    await expect(deleteDocument('Test Doctype', 'DOES-NOT-EXIST')).rejects.toThrow()
  })
})
