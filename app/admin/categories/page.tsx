"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner' 
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export default function CategoriesPage() {
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editParentId, setEditParentId] = useState<string | null>(null)

  const [isCreating, setIsCreating] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // client-side helpers for search/sort/pagination (server may return paged API or full array)
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState<'name'|'code'|'createdAt'>('name')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // modal & form state
  const [viewItem, setViewItem] = useState<any | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create'|'edit'>('create')
  const [formValues, setFormValues] = useState<any>({ active: true })
  const [saving, setSaving] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: session, status } = useSession()
  const router = useRouter()
  // If you run the backend separately, set NEXT_PUBLIC_API_BASE_URL to e.g. http://localhost:8080
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status === 'authenticated' && (session as any)?.user?.role !== 'ADMIN') router.push('/')
  }, [status, session])

  if (status === 'loading') return null

  useEffect(() => {
    fetchList()
  }, [])

  async function fetchList() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pageNumber))
      params.set('size', String(pageSize))
      params.set('sort', `${sortBy},${sortDir}`)
      if (q) params.set('q', q)

      // try v1 first, fallback to legacy endpoint (API_BASE can point to separate backend)
      let r = await fetch(`${API_BASE}/api/v1/admin/categories?${params.toString()}`, { credentials: 'same-origin' })
      if (r.status === 404) r = await fetch(`${API_BASE}/api/admin/categories?${params.toString()}`, { credentials: 'same-origin' })
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()

      if (data && data.content) {
        // paged response expected by new API
        setItems(data.content)
      } else if (Array.isArray(data)) {
        // legacy full-array return: filter/sort/page client-side
        let arr = data as any[]
        if (q) {
          const ql = q.toLowerCase()
          arr = arr.filter((x) => ((String(x.name) + ' ' + String(x.code || '')).toLowerCase().includes(ql)))
        }
        arr = arr.sort((a, b) => {
          const A = String(a[sortBy] ?? '').toLowerCase()
          const B = String(b[sortBy] ?? '').toLowerCase()
          if (A < B) return sortDir === 'asc' ? -1 : 1
          if (A > B) return sortDir === 'asc' ? 1 : -1
          return 0
        })
        const start = pageNumber * pageSize
        setItems(arr.slice(start, start + pageSize))
      } else {
        setItems([])
      }
    } catch (e) {
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  function openCreate() {
    setFormMode('create')
    setFormValues({ active: true })
    setFormOpen(true)
  }

  function openEdit(item: any) {
    setFormMode('edit')
    setFormValues({ ...item })
    setFormOpen(true)
  }

  function openView(item: any) {
    setViewItem(item)
  }

  async function submitForm(e?: React.FormEvent) {
    e?.preventDefault()
    setSaving(true)
    try {
      const payload: any = {
        name: String(formValues.name || ''),
        code: formValues.code || undefined,
        shortCode: formValues.shortCode || undefined,
        slug: formValues.slug || undefined,
        description: formValues.description || undefined,
        parentId: formValues.parentId || undefined,
        active: !!formValues.active,
      }
      // v1 API: POST /api/v1/admin/categories (create) and PATCH /api/v1/admin/categories/{id} (update)
      let r: Response | undefined
      if (formMode === 'create') {
        r = await fetch(`${API_BASE}/api/v1/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
        if (r.status === 404) {
          // fallback to legacy endpoint
          r = await fetch(`${API_BASE}/api/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
        }
      } else {
        r = await fetch(`${API_BASE}/api/v1/admin/categories/${formValues.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
        if (r.status === 404) {
          // fallback to legacy endpoint
          r = await fetch(`${API_BASE}/api/admin/categories`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: formValues.id, ...payload }) })
        }
      }
      if (!r || !r.ok) throw new Error(await (r ? r.text() : Promise.resolve('No response')))
      await r.json()
      toast.success(formMode === 'create' ? 'Category created' : 'Category updated')
      setFormOpen(false)
      fetchList()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete(item: any) {
    setDeleteCandidate(item)
  }

  async function doDelete() {
    if (!deleteCandidate) return
    setDeleting(true)
    try {
      // v1 deletes use path param
      let r = await fetch(`${API_BASE}/api/v1/admin/categories/${deleteCandidate.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' })
      if (r.status === 404) {
        r = await fetch(`${API_BASE}/api/admin/categories`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: deleteCandidate.id }) })
      }
      if (!r.ok) throw new Error(await r.text())
      toast.success('Category deleted')
      setDeleteCandidate(null)
      fetchList()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setDeleting(false)
    }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)
    const body: any = { name }
    if (slug) body.slug = slug
    if (parentId) body.parentId = parentId

    const promise = (async () => {
      let res = await fetch(`${API_BASE}/api/v1/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) })
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/api/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) })
      }
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    })()

    try {
      const c = await toast.promise(promise, {
        loading: 'Creating category...',
        success: 'Category created',
        error: (err) => `Create failed: ${err?.message || err}`,
      })
      setItems((s) => [...s, c])
      setName('')
      setSlug('')
      setParentId(null)
    } catch (err) {
      // handled by toast
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(c: any) {
    setEditingId(c.id)
    setEditName(c.name)
    setEditSlug(c.slug || '')
    setEditParentId(c.parentId ?? null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditSlug('')
    setEditParentId(null)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSavingId(editingId)
    const promise = (async () => {
      // v1 uses PATCH with id in the URL
      let res = await fetch(`${API_BASE}/api/v1/admin/categories/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name: editName, slug: editSlug, parentId: editParentId }) })
      if (res.status === 404) {
        // fallback to legacy PUT
        res = await fetch(`${API_BASE}/api/admin/categories`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: editingId, name: editName, slug: editSlug, parentId: editParentId }) })
      }
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    })()

    try {
      const updated = await toast.promise(promise, {
        loading: 'Saving category...',
        success: 'Category updated',
        error: (err) => `Update failed: ${err?.message || err}`,
      })
      await fetchList()
      cancelEdit()
    } catch (err) {
      // handled by toast
    } finally {
      setSavingId(null)
    }
  }

  // legacy deleteCategory removed — use confirmDelete(item) and doDelete() which show a modal and call the API


  return (
    <div className="p-0">
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Create categories and subcategories</CardDescription>
        </CardHeader>
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <Input placeholder="Search by name or code" value={q} onChange={(e) => { setQ(e.target.value); setPageNumber(0) }} className="min-w-[280px]" />
            <Select value={`${sortBy},${sortDir}`} onValueChange={(v) => { const [col, dir] = String(v).split(','); setSortBy(col as any); setSortDir((dir as any) || 'asc'); }}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={`name,asc`}>Name ↑</SelectItem>
                <SelectItem value={`name,desc`}>Name ↓</SelectItem>
                <SelectItem value={`code,asc`}>Code ↑</SelectItem>
                <SelectItem value={`code,desc`}>Code ↓</SelectItem>
                <SelectItem value={`createdAt,asc`}>Created ↑</SelectItem>
                <SelectItem value={`createdAt,desc`}>Created ↓</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setQ(''); setPageNumber(0); fetchList() }}>Clear</Button>
            <Button onClick={() => openCreate()}>Add New Category</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Short Code</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent ID</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c: any) => (
                <React.Fragment key={c.id}>
                  <TableRow>
                    <TableCell>
                      {editingId === c.id ? (
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      ) : (
                        c.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === c.id ? (
                        <select aria-label="Edit parent category" className="border-input rounded-md px-3 py-2 text-foreground min-w-[160px]" value={isLoading ? '__loading__' : (editParentId ?? '__top__')} onChange={(e) => setEditParentId(e.target.value === '__top__' ? null : (e.target.value || null))} disabled={isLoading}>
                          {isLoading ? (
                            <option value="__loading__" disabled style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Loading categories...</option>
                          ) : (
                            <>
                              <option value="__top__" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>Top-level</option>
                              {items.filter((x) => x.id !== c.id).length === 0 ? (
                                <option value="__none__" style={{ color: '#0f172a', backgroundColor: '#ffffff' }} disabled>No other categories</option>
                              ) : (
                                items.filter((x) => x.id !== c.id).map((x) => <option key={x.id} value={x.id} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>{x.name}</option>)
                              )}
                            </>
                          )}
                        </select>
                      ) : (
                        c.parentId ? (items.find((x) => x.id === c.parentId)?.name ?? '') : ''
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === c.id ? (
                        <div className="flex gap-2 justify-end">
                          <Button onClick={saveEdit} className="bg-green-600" disabled={savingId === editingId}>{savingId === editingId ? 'Saving...' : 'Save'}</Button>
                          <Button onClick={cancelEdit} variant="secondary">Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <Button onClick={() => openEdit(c)} variant="outline">Edit</Button>
                          <Button onClick={() => confirmDelete(c)} className="bg-red-600">Delete</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  {c.children && c.children.length > 0 && c.children.map((ch: any) => (
                    <TableRow key={ch.id} className="bg-muted">
                      <TableCell className="pl-8">↳ {ch.name}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button onClick={() => openEdit(ch)} variant="outline">Edit</Button>
                          <Button onClick={() => confirmDelete(ch)} className="bg-red-600">Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
        <CardFooter />

      {/* View Modal */}
      <Sheet open={!!viewItem} onOpenChange={(open) => { if (!open) setViewItem(null) }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Category Details</SheetTitle>
            <SheetDescription>Details for the selected category</SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-2">
            {viewItem && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>ID</strong><div className="text-xs font-mono">{viewItem.id}</div></div>
                <div><strong>Name</strong><div>{viewItem.name}</div></div>
                <div><strong>Code</strong><div>{viewItem.code}</div></div>
                <div><strong>Short Code</strong><div>{viewItem.shortCode}</div></div>
                <div><strong>Slug</strong><div>{viewItem.slug}</div></div>
                <div><strong>Parent ID</strong><div className="text-xs font-mono">{viewItem.parentId}</div></div>
                <div><strong>Active</strong><div>{viewItem.active ? 'Yes' : 'No'}</div></div>
                <div><strong>Level</strong><div>{viewItem.level}</div></div>
                <div><strong>Path</strong><div>{viewItem.path}</div></div>
                <div><strong>Created By</strong><div>{viewItem.createdBy}</div></div>
                <div><strong>Created At</strong><div className="text-xs">{viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString() : ''}</div></div>
                <div><strong>Updated At</strong><div className="text-xs">{viewItem.updatedAt ? new Date(viewItem.updatedAt).toLocaleString() : ''}</div></div>
                <div className="col-span-2"><strong>Description</strong><div className="whitespace-pre-wrap text-sm">{viewItem.description}</div></div>
              </div>
            )}
          </div>
          <SheetFooter>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setViewItem(null)}>Close</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Form Modal (Create/Edit) */}
      <Sheet open={formOpen} onOpenChange={(open) => setFormOpen(open)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{formMode === 'create' ? 'Add Category' : 'Edit Category'}</SheetTitle>
            <SheetDescription>{formMode === 'create' ? 'Create a new category' : 'Edit category details'}</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitForm} className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Name</Label>
                <Input value={String(formValues.name || '')} onChange={(e) => setFormValues((s) => ({ ...s, name: e.target.value }))} required />
              </div>
              <div>
                <Label>Code</Label>
                <Input value={String(formValues.code || '')} onChange={(e) => setFormValues((s) => ({ ...s, code: e.target.value }))} />
              </div>
              <div>
                <Label>Short Code</Label>
                <Input value={String(formValues.shortCode || '')} onChange={(e) => setFormValues((s) => ({ ...s, shortCode: e.target.value }))} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={String(formValues.slug || '')} onChange={(e) => setFormValues((s) => ({ ...s, slug: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Input value={String(formValues.description || '')} onChange={(e) => setFormValues((s) => ({ ...s, description: e.target.value }))} />
              </div>
              <div>
                <Label>Parent</Label>
                <select className="border-input rounded-md px-3 py-2 text-foreground min-w-[160px]" value={formValues.parentId ?? '__top__'} onChange={(e) => setFormValues((s) => ({ ...s, parentId: e.target.value === '__top__' ? null : (e.target.value || null) }))}>
                  <option value="__top__">Top-level</option>
                  {items.filter((x) => x.id !== formValues.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={!!formValues.active} onCheckedChange={(v) => setFormValues((s) => ({ ...s, active: !!v }))} />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : (formMode === 'create' ? 'Create' : 'Update')}</Button>
              <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Sheet open={!!deleteCandidate} onOpenChange={(open) => { if (!open) setDeleteCandidate(null) }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Confirm Delete</SheetTitle>
            <SheetDescription>Deleting this category will remove it and its direct subcategories.</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <div className="text-sm">Are you sure you want to delete <strong>{deleteCandidate?.name}</strong>?</div>
            <div className="flex gap-2 justify-end mt-4">
              <Button onClick={() => setDeleteCandidate(null)} variant="secondary">Cancel</Button>
              <Button onClick={doDelete} className="bg-red-600" disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      </Card>
    </div>
  )
}
