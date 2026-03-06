"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { formatErrorMessage } from '@/lib/api-helpers'
import { LoadingSpinner, ErrorAlert } from '@/components/ui/loading-error'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { buildApiUrl } from '@/lib/api-config'
import { signinPath } from '@/lib/appPaths'

export default function BrandsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalElements, setTotalElements] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState<'name'|'id'|'createdAt'>('name')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create'|'edit'>('create')
  const [formValues, setFormValues] = useState<any>({ isActive: true })
  const [saving, setSaving] = useState(false)

  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push(signinPath())
    if (status === 'authenticated' && String((session as any)?.user?.role || '').toLowerCase() !== 'admin') router.push('/')
  }, [status, session, router])

  useEffect(() => { if (status === 'authenticated') fetchList() }, [status, pageNumber, pageSize, sortBy, sortDir, q])

  async function fetchList() {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | boolean> = {
        page: pageNumber,
        size: pageSize,
        sort: `${sortBy},${sortDir}`,
        ...(q ? { q } : {})
      }
      const url = buildApiUrl('/api/v1/brands', params)
      const r = await fetch(url, { credentials: 'same-origin' })
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()
      if (data && data.content) {
        setItems(data.content)
        if (data.page) {
          setPageNumber(typeof data.page.number === 'number' ? Number(data.page.number) : pageNumber)
          setPageSize(typeof data.page.size === 'number' ? Number(data.page.size) : pageSize)
          setTotalElements(typeof data.page.totalElements === 'number' ? Number(data.page.totalElements) : null)
          setTotalPages(typeof data.page.totalPages === 'number' ? Number(data.page.totalPages) : null)
        }
      } else if (Array.isArray(data)) {
        setItems(data)
        setTotalElements(data.length)
        setTotalPages(Math.max(1, Math.ceil(data.length / pageSize)))
      } else {
        setItems([])
      }
    } catch (err) {
      setItems([])
      setError(formatErrorMessage(err))
      toast.error(formatErrorMessage(err))
    } finally { setLoading(false) }
  }

  function openCreate() {
    setFormMode('create')
    setFormValues({ isActive: true })
    setFormOpen(true)
  }

  function openEdit(item: any) {
    setFormMode('edit')
    setFormValues({ ...item })
    setFormOpen(true)
  }

  async function submitForm(e?: React.FormEvent) {
    e?.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: String(formValues.name || ''),
        description: formValues.description || undefined,
        logoUrl: formValues.logoUrl || undefined,
        isActive: !!formValues.isActive,
        isGlobal: !!formValues.isGlobal
      }
      let r: Response
      if (formMode === 'create') {
        const url = buildApiUrl('/api/v1/brands')
        r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
      } else {
        const id = formValues.id
        if (!id) throw new Error('Missing id')
        const url = buildApiUrl(`/api/v1/brands/${id}`)
        r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
      }
      if (!r.ok) throw new Error(await r.text())
      await r.json()
      toast.success(formMode === 'create' ? 'Brand created' : 'Brand updated')
      setFormOpen(false)
      fetchList()
    } catch (err) {
      const msg = formatErrorMessage(err)
      toast.error(msg)
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-0">
      <Card>
        <CardHeader>
          <CardTitle>Brands</CardTitle>
          <CardDescription>Manage product brands</CardDescription>
        </CardHeader>
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <Button onClick={openCreate}>Add New Brand</Button>
            <Button onClick={fetchList}>Refresh</Button>
            <Input placeholder="Search brands" value={q} onChange={(e) => { setQ(e.target.value); setPageNumber(0) }} className="min-w-[240px]" />
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as any); setPageNumber(0) }} className="border rounded px-2 py-1">
              <option value="name">Name</option>
              <option value="id">ID</option>
              <option value="createdAt">Created</option>
            </select>
            <select value={sortDir} onChange={(e) => { setSortDir(e.target.value as any); setPageNumber(0) }} className="border rounded px-2 py-1">
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner text="Loading brands..." /></div>
          ) : error ? (
            <ErrorAlert error={error} onRetry={fetchList} />
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Global</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs font-mono">{b.id}</TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell className="text-xs">{b.logoUrl || ''}</TableCell>
                  <TableCell>{b.isGlobal ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-xs">{b.ownerId || ''}</TableCell>
                  <TableCell>{b.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-xs">{b.createdAt ? new Date(b.createdAt).toLocaleString() : ''}</TableCell>
                  <TableCell className="text-xs">{b.updatedAt ? new Date(b.updatedAt).toLocaleString() : ''}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button onClick={() => openEdit(b)} variant="outline">Edit</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Total: {totalElements ?? '—'}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setPageNumber((p) => Math.max(0, p - 1)); }} disabled={pageNumber === 0} className="px-2 py-1 border rounded">Prev</button>
              <div className="text-sm">Page { (pageNumber + 1) }{ totalPages ? ` of ${totalPages}` : '' }</div>
              <button onClick={() => { setPageNumber((p) => Math.min((totalPages ?? 1) - 1, p + 1)); }} disabled={totalPages ? pageNumber >= (totalPages - 1) : false} className="px-2 py-1 border rounded">Next</button>
              <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPageNumber(0); }} className="border rounded px-2 py-1">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{formMode === 'create' ? 'Create Brand' : 'Edit Brand'}</SheetTitle>
            <SheetDescription>Provide brand details</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitForm} className="space-y-4 p-4">
            <div>
              <Label>Name</Label>
              <Input value={formValues.name || ''} onChange={(e) => setFormValues({ ...formValues, name: e.target.value })} required />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={formValues.description || ''} onChange={(e) => setFormValues({ ...formValues, description: e.target.value })} />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input value={formValues.logoUrl || ''} onChange={(e) => setFormValues({ ...formValues, logoUrl: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <Checkbox checked={!!formValues.isActive} onCheckedChange={(v) => setFormValues({ ...formValues, isActive: !!v })} />
              <Label>Active</Label>
              <Checkbox checked={!!formValues.isGlobal} onCheckedChange={(v) => setFormValues({ ...formValues, isGlobal: !!v })} />
              <Label>Global</Label>
            </div>
            <SheetFooter>
              <div className="flex gap-2 justify-end">
                <Button type="submit">Save</Button>
                <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
