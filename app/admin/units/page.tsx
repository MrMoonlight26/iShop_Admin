"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RequireAuth from '@/components/require-auth'
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { api } from '@/lib/apiClient'
import { signinPath } from '@/lib/appPaths'

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([])
  const [name, setName] = useState('')
  const [short, setShort] = useState('')
  // Accept free-form value input (string) and parse if numeric
  const [valueInput, setValueInput] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editShort, setEditShort] = useState('')
  const [editValueInput, setEditValueInput] = useState('')

  // API base and pagination

  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalElements, setTotalElements] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<any | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // loading states
  const [isCreating, setIsCreating] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    fetchList()
  }, [pageNumber, pageSize])

  async function fetchList() {
    setIsLoading(true)
    try {
      const params: Record<string, string | number> = {
        page: pageNumber,
        size: pageSize
      }
      let r: any = null
      try {
        r = await api.get('/admin/units/types', { params })
      } catch (e: any) {
        if (e.response?.status === 404) {
          r = await api.get('/admin/units', { params })
        } else throw e
      }
      const raw = r.data

      // Support paged shape
      const content = raw.content ?? raw
      const items = Array.isArray(content) ? content : []
      setUnits(items)

      if (raw.page) {
        setPageNumber(typeof raw.page.number === 'number' ? Number(raw.page.number) : 0)
        setPageSize(typeof raw.page.size === 'number' ? Number(raw.page.size) : pageSize)
        setTotalElements(typeof raw.page.totalElements === 'number' ? Number(raw.page.totalElements) : null)
        setTotalPages(typeof raw.page.totalPages === 'number' ? Number(raw.page.totalPages) : null)
      } else {
        setTotalElements(Array.isArray(content) ? (content as any[]).length : null)
        setTotalPages(Array.isArray(content) ? Math.max(1, Math.ceil((content as any[]).length / pageSize)) : null)
      }
    } catch (err) {
      setUnits([])
      setTotalElements(0)
      setTotalPages(1)
      toast.error(String(err))
    } finally { setIsLoading(false) }
  }

  async function createUnit(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)
    // determine whether input is numeric or raw string
    const parsed = (() => {
      const s = String(valueInput).trim()
      if (!s) return { number: null, raw: '' }
      const n = Number(s)
      if (!Number.isNaN(n)) return { number: n, raw: '' }
      return { number: null, raw: s }
    })()

    if (parsed.number === null && parsed.raw === '') {
      toast.error('Please provide a numeric value (>0) or a non-empty string')
      setIsCreating(false)
      return
    }

    const body: any = { name: String(name || '').trim(), short: String(short || '').trim() }
    if (parsed.number !== null) body.value = parsed.number
    if (parsed.raw) body.valueRaw = parsed.raw

    const promise = (async () => {
      let res: any = null
      try {
        res = await api.post('/admin/units/types', body)
      } catch (e: any) {
        if (e.response?.status === 404) {
          res = await api.post('/admin/units', body)
        } else throw e
      }
      return res.data
    })()

    try {
      const newUnit = await toast.promise(promise, {
        loading: 'Creating unit...',
        success: 'Unit created',
        error: (err) => `Create failed: ${err?.message || err}`,
      })
      setUnits((s: any[]) => [...s, newUnit])
      setName('')
      setShort('')
      setValueInput('')
      // notify other admin pages (catalog) to refresh units
      try { window.dispatchEvent(new CustomEvent('units:updated', { detail: { action: 'create', unit: newUnit } })) } catch (e) { /* noop in SSR or non-window env */ }
    } catch (err) {
      // handled by toast
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(unit: any) {
    setEditingId(unit.id)
    setEditName(unit.name)
    setEditShort(unit.short || '')
    // prefer valueRaw if present; otherwise use numeric as string
    setEditValueInput(unit.valueRaw ?? (typeof unit.value === 'number' ? String(unit.value) : ''))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditShort('')
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSavingId(editingId)

    const parsed = (() => {
      const s = String(editValueInput ?? '').trim()
      if (!s) return { number: null, raw: '' }
      const n = Number(s)
      if (!Number.isNaN(n)) return { number: n, raw: '' }
      return { number: null, raw: s }
    })()

    if (parsed.number === null && parsed.raw === '') {
      toast.error('Please provide a numeric value (>0) or a non-empty string')
      setSavingId(null)
      return
    }

    const body: any = { id: editingId, name: editName, short: editShort }
    if (parsed.number !== null) body.value = parsed.number
    if (parsed.raw) body.valueRaw = parsed.raw

    const promise = (async () => {
      let res: any = null
      try {
        res = await api.patch(`/admin/units/types/${editingId}`, body)
      } catch (e: any) {
        if (e.response?.status === 404) {
          res = await api.put('/admin/units', body)
        } else throw e
      }
      return res.data
    })()

    try {
      const updated = await toast.promise(promise, {
        loading: 'Saving unit...',
        success: 'Unit updated',
        error: (err) => `Update failed: ${err?.message || err}`,
      })
      // refresh list after update to avoid local merge complexity
      try {
        const listRes = await api.get('/admin/units')
        if (listRes) {
          const list = listRes.data
          setUnits(list)
          try { window.dispatchEvent(new CustomEvent('units:updated', { detail: { action: 'update' } })) } catch (e) {}
        }
      } catch (e) {
        // ignore refresh errors
      }
      cancelEdit()
    } catch (err) {
      // handled by toast
    } finally {
      setSavingId(null)
    }
  }

  function confirmDelete(unit: any) { setDeleteCandidate(unit) }

  async function doDelete() {
    if (!deleteCandidate) return
    setDeleting(deleteCandidate.id)
    try {
      try {
        await api.delete(`/admin/units/types/${deleteCandidate.id}`)
      } catch (e: any) {
        if (e.response?.status === 404) {
          await api.delete('/admin/units', { data: { id: deleteCandidate.id } })
        } else throw e
      }
      toast.success('Unit deleted')
      setUnits((units as any[]).filter((u: any) => (u as any).id !== deleteCandidate.id))
      try { window.dispatchEvent(new CustomEvent('units:updated', { detail: { action: 'delete', id: deleteCandidate.id } })) } catch (e) {}
      setDeleteCandidate(null)
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
          <CardDescription>Manage central unit types used across products</CardDescription>
        </CardHeader>
        <div className="p-4">
          <form onSubmit={createUnit} className="mb-4 flex gap-2">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Short" value={short} onChange={(e) => setShort(e.target.value)} className="w-24" />
            <Input placeholder="Value (number or text)" value={valueInput} onChange={(e) => setValueInput(e.target.value)} className="w-36" />
            <Button type="submit" disabled={isCreating || !(name.trim() && (valueInput.trim().length > 0))}>{isCreating ? 'Creating...' : 'Create'}</Button>
          </form>
          {!(name.trim() && (valueInput.trim().length > 0)) && (
            <div className="text-sm text-red-500 mt-1">Name and Value (number or non-empty text) are required to create a unit.</div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Short</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>
                    {editingId === u.id ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      u.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === u.id ? (
                      <Input value={editShort} onChange={(e) => setEditShort(e.target.value)} className="w-24" />
                    ) : (
                      u.short
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === u.id ? (
                      <div>
                        <Input value={editValueInput} onChange={(e) => setEditValueInput(e.target.value)} className="w-28" required />
                        {!(editValueInput.trim().length > 0) && <div className="text-sm text-red-500 mt-1">Value is required</div>}
                      </div>
                    ) : (
                      (typeof u.value === 'number' ? String(u.value) : (u.valueRaw ?? ''))
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === u.id ? (
                      <div className="flex gap-2 justify-end">
                        <Button onClick={saveEdit} className="bg-green-600" disabled={savingId === editingId || !(editValueInput.trim().length > 0)}>{savingId === editingId ? 'Saving...' : 'Save'}</Button>
                        <Button onClick={cancelEdit} variant="secondary">Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <Button onClick={() => startEdit(u)} variant="outline">Edit</Button>
                        <Button onClick={() => confirmDelete(u)} className="bg-red-600" disabled={deleting === u.id}>{deleting === u.id ? 'Deleting...' : 'Delete'}</Button>
                      </div>
                    )}
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

        {/* Delete confirmation */}
        <Sheet open={!!deleteCandidate} onOpenChange={(open) => { if (!open) setDeleteCandidate(null) }}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Confirm Delete</SheetTitle>
              <SheetDescription>Deleting this unit will remove it and references from products.</SheetDescription>
            </SheetHeader>
            <div className="p-4">
              <div className="text-sm">Are you sure you want to delete <strong>{deleteCandidate?.name}</strong>?</div>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="secondary" onClick={() => setDeleteCandidate(null)}>Cancel</Button>
                        <Button onClick={doDelete} className="bg-red-600" disabled={!!deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </Card>
    </div>
  )
}
