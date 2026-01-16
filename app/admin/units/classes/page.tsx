"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'

export default function UnitClassesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')

  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [q, setQ] = useState('')
  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalElements, setTotalElements] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formValues, setFormValues] = useState<any>({ name: '', baseUnitName: '' })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status === 'authenticated' && (session as any)?.user?.role !== 'ADMIN') router.push('/')
  }, [status, session])

  useEffect(() => {
    fetchList()
  }, [pageNumber, pageSize, q])

  async function fetchList() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pageNumber))
      params.set('size', String(pageSize))
      if (q) params.set('q', q)

      let url = `${API_BASE ? API_BASE : ''}/api/v1/admin/units/classes?${params.toString()}`
      if (!API_BASE) url = `/api/v1/admin/units/classes?${params.toString()}`

      let r = await fetch(url, { credentials: 'same-origin' })
      if (r.status === 404) {
        // fallback to legacy endpoint
        const fallback = `${API_BASE ? API_BASE : ''}/api/v1/admin/units/classes?${params.toString()}`
        r = await fetch(!API_BASE ? `/api/v1/admin/units/classes?${params.toString()}` : fallback, { credentials: 'same-origin' })
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

  async function submitForm(e?: React.FormEvent) {
    e?.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: String(formValues.name || ''),
        baseUnitName: String(formValues.baseUnitName || ''),
      }
      let r = await fetch(`${API_BASE ? API_BASE : ''}/api/v1/admin/units/classes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
      if (!API_BASE && r.status === 404) {
        r = await fetch('/api/v1/admin/units/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
      } else if (r.status === 404) {
        // try legacy
        r = await fetch(`${API_BASE}/api/v1/admin/units/classes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
      }
      if (!r.ok) throw new Error(await r.text())
      await r.json()
      toast.success('Unit class created')
      setFormOpen(false)
      setFormValues({ name: '', baseUnitName: '' })
      fetchList()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-0">
      <Card>
        <CardHeader>
          <CardTitle>Unit Classes</CardTitle>
          <CardDescription>Manage unit classes used to group unit types</CardDescription>
        </CardHeader>
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <Input placeholder="Search by name" value={q} onChange={(e) => { setQ(e.target.value); setPageNumber(0) }} className="min-w-[240px]" />
            <Button onClick={() => { setQ(''); setPageNumber(0); fetchList() }}>Clear</Button>
            <Button onClick={() => { setFormOpen(true); setFormValues({ name: '', baseUnitName: '' }) }}>Add Unit Class</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Base Unit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs font-mono">{c.id}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.baseUnitName ?? ''}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {/* For now we only support create; editing can be added later */}
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

        {/* Create Modal */}
        <Sheet open={formOpen} onOpenChange={(open) => setFormOpen(open)}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Add Unit Class</SheetTitle>
              <SheetDescription>Create a new unit class</SheetDescription>
            </SheetHeader>
            <form onSubmit={submitForm} className="p-4 space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={String(formValues.name || '')} onChange={(e) => setFormValues((s) => ({ ...s, name: e.target.value }))} required />
              </div>
              <div>
                <Label>Base Unit Name</Label>
                <Input value={String(formValues.baseUnitName || '')} onChange={(e) => setFormValues((s) => ({ ...s, baseUnitName: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create'}</Button>
                <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

      </Card>
    </div>
  )
}
