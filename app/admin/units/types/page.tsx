"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RequireAuth from '@/components/require-auth'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { LoadingSpinner, ErrorAlert } from '@/components/ui/loading-error'
import { formatErrorMessage } from '@/lib/api-helpers'
import { api } from '@/lib/apiClient'
import { signinPath } from '@/lib/appPaths'

export default function UnitTypesPage() {
  const router = useRouter()


  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [q, setQ] = useState('')
  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalElements, setTotalElements] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create'|'edit'>('create')
  const [formValues, setFormValues] = useState<any>({ name: '', abbreviation: '', unitClassId: '', conversionFactor: 1 })
  const [saving, setSaving] = useState(false)
  const [unitClassFilter, setUnitClassFilter] = useState<string>('')

  const [classes, setClasses] = useState<any[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // rely on server middleware + RequireAuth for auth checks
  useEffect(() => {
    fetchList()
    fetchClasses()
  }, [pageNumber, pageSize, q, unitClassFilter])

  async function fetchClasses() {
    try {
      let r: any = null
      try {
        r = await api.get('/admin/units/classes')
      } catch (e: any) {
        if (e.response?.status === 404) {
          r = await api.get('/admin/units/classes')
        } else {
          throw e
        }
      }
      const data = r.data
      const content = data.content ?? data
      setClasses(Array.isArray(content) ? content : [])
    } catch (err) {
      const msg = formatErrorMessage(err)
      setError(msg)
      toast.error(msg)
      setClasses([])
    }
  }

  async function fetchList() {
    setIsLoading(true)
    try {
      const params: Record<string, string | number> = {
        page: pageNumber,
        size: pageSize,
        ...(q ? { q } : {}),
        ...(unitClassFilter ? { unitClassId: unitClassFilter } : {})
      }
      let r: any = null
      try {
        r = await api.get('/admin/units/types', { params })
      } catch (e: any) {
        if (e.response?.status === 404) {
          r = await api.get('/admin/units/types', { params })
        } else {
          throw e
        }
      }
      const data = r.data

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
      const msg = formatErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  function openCreate() { setFormMode('create'); setFormValues({ name: '', abbreviation: '', unitClassId: classes[0]?.id ?? '', conversionFactor: 1 }); setFormOpen(true) }
  function openEdit(t: any) { setFormMode('edit'); setFormValues({ ...t, id: t.id ?? (t as any).unitTypeId ?? null }); setFormOpen(true) }

  async function submitForm(e?: React.FormEvent) {
    e?.preventDefault()
    setSaving(true)
    try {
      const payload = {
        id: formValues.id,
        name: String(formValues.name || ''),
        abbreviation: String(formValues.abbreviation || ''),
        unitClassId: formValues.unitClassId || undefined,
        conversionFactor: Number(formValues.conversionFactor ?? 1)
      }

      let r: any = null
      if (formMode === 'create') {
        try {
          r = await api.post('/admin/units/types', payload)
        } catch (e: any) {
          if (e.response?.status === 404) {
            r = await api.post('/admin/units/types', payload)
          } else {
            throw e
          }
        }
      } else {
        const id = formValues.id
        if (!id) throw new Error('Missing unit type id for update')
        try {
          r = await api.patch(`/admin/units/types/${id}`, payload)
        } catch (e: any) {
          if (e.response?.status === 404) {
            // fallback: attempt PUT path that accepts id in body
            r = await api.put('/admin/units/types', { id, ...payload })
          } else throw e
        }
      }

      if (!r) throw new Error('No response')
      await r.data
      toast.success(formMode === 'create' ? 'Unit type created' : 'Unit type updated')
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

  async function confirmDelete(id: string) {
    setConfirmDeleteId(id)
  }

  async function doDelete() {
    if (!confirmDeleteId) return
    setDeleting(confirmDeleteId)
    try {
      try {
        await api.delete(`/admin/units/types/${confirmDeleteId}`)
      } catch (e: any) {
        if (e.response?.status === 404) {
          await api.delete('/admin/units/types', { data: { id: confirmDeleteId } })
        } else {
          throw e
        }
      }
      toast.success('Unit type deleted')
      setConfirmDeleteId(null)
      fetchList()
    } catch (err) {
      const msg = formatErrorMessage(err)
      toast.error(msg)
      setError(msg)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <RequireAuth>
      <div className="p-0">
      <Card>
        <CardHeader>
          <CardTitle>Unit Types</CardTitle>
          <CardDescription>Manage units and their conversion factors</CardDescription>
        </CardHeader>
        <div className="p-4">
            <div className="mb-4 flex items-center gap-2">
            <Input placeholder="Search by name or abbreviation" value={q} onChange={(e) => { setQ(e.target.value); setPageNumber(0) }} className="min-w-[280px]" />
                    <Select value={String(unitClassFilter ?? '')} onValueChange={(v) => { setUnitClassFilter(v); setPageNumber(0); }}>
                      <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {classes.map((cl) => {
                          const base = cl.baseUnitName ?? cl.baseUnit ?? ''
                          const label = base ? `${cl.name} — ${base}` : cl.name
                          return <SelectItem key={cl.id} value={cl.id}>{label}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>
            <Button onClick={() => { setQ(''); setPageNumber(0); }}>Clear</Button>
            <Button onClick={openCreate}>Add Unit Type</Button>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner text="Loading unit types..." /></div>
          ) : error ? (
            <ErrorAlert error={error} onRetry={fetchList} />
          ) : (
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
                <Input value={String(formValues.name || '')} onChange={(e) => setFormValues((s: any) => ({ ...s, name: e.target.value }))} required />
              </div>
              <div>
                <Label>Abbreviation</Label>
                <Input value={String(formValues.abbreviation || '')} onChange={(e) => setFormValues((s: any) => ({ ...s, abbreviation: e.target.value }))} />
              </div>
              <div>
                <Label>Unit Class</Label>
                <select value={String(formValues.unitClassId ?? '')} onChange={(e) => setFormValues((s: any) => ({ ...s, unitClassId: e.target.value }))} className="border rounded px-2 py-2 w-full">
                  <option value="">Select class</option>
                  {classes.map((cl)=> {
                    const base = cl.baseUnitName ?? cl.baseUnit ?? ''
                    const label = base ? `${cl.name} — ${base}` : cl.name
                    return <option key={cl.id} value={cl.id}>{label}</option>
                  })}
                </select>
              </div>
              <div>
                <Label>Conversion Factor</Label>
                <Input type="number" value={String(formValues.conversionFactor ?? 1)} onChange={(e)=> setFormValues((s: any)=>({...s, conversionFactor: Number(e.target.value)}))} />
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
                <Button onClick={doDelete} className="bg-red-600" disabled={!!deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </Card>
    </div>
    </RequireAuth>
  )
}
