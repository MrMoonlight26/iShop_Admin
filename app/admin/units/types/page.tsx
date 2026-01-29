"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { buildApiUrl } from '@/lib/api-config'

export default function UnitTypesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()


  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [q, setQ] = useState('')
  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalElements, setTotalElements] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create'|'edit'>('create')
  const [formValues, setFormValues] = useState<any>({ name: '', abbreviation: '', unitClassId: '', conversionFactor: 1 })
  const [saving, setSaving] = useState(false)

  const [classes, setClasses] = useState<any[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status === 'authenticated' && (session as any)?.user?.role !== 'ADMIN') router.push('/')
  }, [status, session])

  useEffect(() => {
    fetchList()
    fetchClasses()
  }, [pageNumber, pageSize, q])

  async function fetchClasses() {
    try {
      let url = buildApiUrl('/api/v1/admin/units/classes')
      let r = await fetch(url, { credentials: 'same-origin' })
      if (r.status === 404) r = await fetch(url, { credentials: 'same-origin' })
      if (!r.ok) return setClasses([])
      const data = await r.json()
      const content = data.content ?? data
      setClasses(Array.isArray(content) ? content : [])
    } catch (err) {
      setClasses([])
    }
  }

  async function fetchList() {
    setIsLoading(true)
    try {
      const params: Record<string, string | number> = {
        page: pageNumber,
        size: pageSize,
        ...(q ? { q } : {})
      }
      let url = buildApiUrl('/api/v1/admin/units/types', params)
      let r = await fetch(url, { credentials: 'same-origin' })
      if (r.status === 404) {
        r = await fetch(url, { credentials: 'same-origin' })
      }
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()

      if (data && data.content) {
        setItems(data.content)
        if (data.page) {
          setPageNumber(typeof data.page.number === 'number' ? Number(data.page.number) : 0)
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
        setTotalElements(0)
        setTotalPages(1)
      }
    } catch (err) {
      setItems([])
      setTotalElements(0)
      setTotalPages(1)
      toast.error(String(err))
    } finally {
      setIsLoading(false)
    }
  }

  function openCreate() { setFormMode('create'); setFormValues({ name: '', abbreviation: '', unitClassId: classes[0]?.id ?? '', conversionFactor: 1 }); setFormOpen(true) }
  function openEdit(t: any) { setFormMode('edit'); setFormValues({ ...t }); setFormOpen(true) }

  async function submitForm(e?: React.FormEvent) {
    e?.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: String(formValues.name || ''),
        abbreviation: String(formValues.abbreviation || ''),
        unitClassId: formValues.unitClassId || undefined,
        conversionFactor: Number(formValues.conversionFactor ?? 1)
      }

      let r: Response | undefined
      if (formMode === 'create') {
        let url = buildApiUrl('/api/v1/admin/units/types')
        r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
        if (r.status === 404) r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
      } else {
        let url = buildApiUrl(`/api/v1/admin/units/types/${formValues.id}`)
        r = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
        if (r.status === 404) {
          url = buildApiUrl('/api/v1/admin/units/types')
          r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: formValues.id, ...payload }) })
        }
      }

      if (!r || !r.ok) throw new Error(await (r ? r.text() : Promise.resolve('No response')))
      await r.json()
      toast.success(formMode === 'create' ? 'Unit type created' : 'Unit type updated')
      setFormOpen(false)
      fetchList()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete(id: string) {
    setConfirmDeleteId(id)
  }

  async function doDelete() {
    if (!confirmDeleteId) return
    setDeleting(confirmDeleteId)
    try {
      let url = buildApiUrl(`/api/v1/admin/units/types/${confirmDeleteId}`)
      let r = await fetch(url, { method: 'DELETE', credentials: 'same-origin' })
      if (r.status === 404) {
        url = buildApiUrl('/api/v1/admin/units/types')
        r = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: confirmDeleteId }) })
      }
      if (!r.ok) throw new Error(await r.text())
      toast.success('Unit type deleted')
      setConfirmDeleteId(null)
      fetchList()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-0">
      <Card>
        <CardHeader>
          <CardTitle>Unit Types</CardTitle>
          <CardDescription>Manage units and their conversion factors</CardDescription>
        </CardHeader>
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <Input placeholder="Search by name or abbreviation" value={q} onChange={(e) => { setQ(e.target.value); setPageNumber(0) }} className="min-w-[280px]" />
            <Select value={String(formValues.unitClassId ?? '')} onValueChange={(v) => setFormValues((s:any)=>({...s, unitClassId: v }))}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {classes.map((cl) => <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => { setQ(''); setPageNumber(0); fetchList() }}>Clear</Button>
            <Button onClick={openCreate}>Add Unit Type</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Abbrev</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs font-mono">{t.id}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.abbreviation}</TableCell>
                  <TableCell>{t.unitClassName ?? ''}</TableCell>
                  <TableCell>{t.conversionFactor}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button onClick={() => openEdit(t)} variant="outline">Edit</Button>
                      <Button onClick={() => confirmDelete(t.id)} className="bg-red-600" disabled={deleting === t.id}>{deleting === t.id ? 'Deleting...' : 'Delete'}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Total: {totalElements ?? '—'}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setPageNumber((p) => Math.max(0, p - 1)); fetchList() }} disabled={pageNumber === 0} className="px-2 py-1 border rounded">Prev</button>
              <div className="text-sm">Page { (pageNumber + 1) }{ totalPages ? ` of ${totalPages}` : '' }</div>
              <button onClick={() => { setPageNumber((p) => Math.min((totalPages ?? 1) - 1, p + 1)); fetchList() }} disabled={totalPages ? pageNumber >= (totalPages - 1) : false} className="px-2 py-1 border rounded">Next</button>
              <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPageNumber(0); fetchList() }} className="border rounded px-2 py-1">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

        </div>
        <CardFooter />

        {/* Create/Edit Sheet */}
        <Sheet open={formOpen} onOpenChange={(open) => setFormOpen(open)}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{formMode === 'create' ? 'Add Unit Type' : 'Edit Unit Type'}</SheetTitle>
              <SheetDescription>{formMode === 'create' ? 'Create a new unit type' : 'Update unit type details'}</SheetDescription>
            </SheetHeader>
            <form onSubmit={submitForm} className="p-4 space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={String(formValues.name || '')} onChange={(e) => setFormValues((s)=>({...s, name: e.target.value}))} required />
              </div>
              <div>
                <Label>Abbreviation</Label>
                <Input value={String(formValues.abbreviation || '')} onChange={(e) => setFormValues((s)=>({...s, abbreviation: e.target.value}))} />
              </div>
              <div>
                <Label>Unit Class</Label>
                <select value={String(formValues.unitClassId ?? '')} onChange={(e) => setFormValues((s)=>({...s, unitClassId: e.target.value}))} className="border rounded px-2 py-2 w-full">
                  <option value="">Select class</option>
                  {classes.map((cl)=> <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Conversion Factor</Label>
                <Input type="number" value={String(formValues.conversionFactor ?? 1)} onChange={(e)=> setFormValues((s)=>({...s, conversionFactor: Number(e.target.value)}))} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : (formMode === 'create' ? 'Create' : 'Update')}</Button>
                <Button variant="secondary" onClick={()=> setFormOpen(false)}>Cancel</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        {/* Delete confirm Sheet */}
        <Sheet open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Confirm Delete</SheetTitle>
              <SheetDescription>Deleting this unit type will remove it from products that reference it.</SheetDescription>
            </SheetHeader>
            <div className="p-4">
              <div className="text-sm">Are you sure you want to delete this unit type?</div>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                <Button onClick={doDelete} className="bg-red-600" disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

      </Card>
    </div>
  )
}
