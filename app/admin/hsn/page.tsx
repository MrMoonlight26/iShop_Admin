"use client"

import React, { useEffect, useState } from 'react'
import RequireAuth from '@/components/require-auth'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { LoadingSpinner, ErrorAlert } from '@/components/ui/loading-error'
import { formatErrorMessage } from '@/lib/api-helpers'
import { apiFetch } from '@/lib/api-config'

export default function HsnManagementPage() {
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalElements, setTotalElements] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formValues, setFormValues] = useState<any>({ hsnCode: '', description: '', portalDescription: '', uqc: '', igstRate: 0, compensationCess: 0, isReportableB2B: true, isReportableB2C: true })

  useEffect(() => { fetchList() }, [pageNumber, pageSize])

  async function fetchList() {
    setIsLoading(true)
    setError(null)
    try {
      // If query present call dedicated search endpoint which returns an array
      if (q && String(q).trim().length > 0) {
        const res = await apiFetch('/api/v1/admin/hsn/search', { params: { q: q.trim() } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setItems(Array.isArray(data) ? data : (data.content ?? []))
        setTotalElements(Array.isArray(data) ? data.length : (data.totalElements ?? null))
        setTotalPages(null)
        setPageNumber(0)
      } else {
        const res = await apiFetch('/api/v1/admin/hsn', { params: { page: pageNumber, size: pageSize } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const content = data.content ?? data
        setItems(Array.isArray(content) ? content : [])
        setTotalElements(typeof data.totalElements === 'number' ? Number(data.totalElements) : (Array.isArray(content) ? content.length : null))
        setTotalPages(typeof data.totalPages === 'number' ? Number(data.totalPages) : null)
      }
    } catch (err) {
      const msg = formatErrorMessage(err)
      setError(msg)
      toast.error(msg)
      setItems([])
      setTotalElements(0)
    } finally {
      setIsLoading(false)
    }
  }

  function openCreate() {
    setFormValues({ hsnCode: '', description: '', portalDescription: '', uqc: '', igstRate: 0, compensationCess: 0, isReportableB2B: true, isReportableB2C: true })
    setFormOpen(true)
  }

  async function submitForm(e?: React.FormEvent) {
    e?.preventDefault()
    setSaving(true)
    setError(null)
    try {
      // client-side validation mirroring backend constraints
      const code = String(formValues.hsnCode || '').trim()
      if (!/^[0-9]{4}$/.test(code) && !/^[0-9]{6}$/.test(code) && !/^[0-9]{8}$/.test(code)) {
        throw new Error('HSN Code must be 4, 6, or 8 digits')
      }
      const desc = String(formValues.description || '').trim()
      if (!desc) throw new Error('Description is required')
      const uqc = String(formValues.uqc || '').trim()
      if (!uqc) throw new Error('Unit Quantity is required')
      const compensation = Number(formValues.compensationCess ?? NaN)
      if (Number.isNaN(compensation) || compensation < 0) throw new Error('Compensation Cess is mandatory and must be >= 0')

      const payload = {
        hsnCode: code,
        description: desc,
        portalDescription: String(formValues.portalDescription || '').trim(),
        uqc,
        igstRate: Number(formValues.igstRate ?? 0),
        compensationCess: compensation,
        isReportableB2B: !!formValues.isReportableB2B,
        isReportableB2C: !!formValues.isReportableB2C,
      }

      const res = await apiFetch('/api/v1/admin/hsn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 204) {
        toast.success('HSN created')
        setFormOpen(false)
        setPageNumber(0)
        await fetchList()
        return
      }

      if (!res.ok) {
        let bodyMsg = ''
        try { const b = await res.json(); bodyMsg = b?.message || JSON.stringify(b) } catch (e) {}
        throw new Error(bodyMsg || `HTTP ${res.status}`)
      }

      await res.json()
      toast.success('HSN created')
      setFormOpen(false)
      await fetchList()
    } catch (err) {
      const msg = formatErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <RequireAuth>
      <div className="p-0">
        <Card>
          <CardHeader>
            <CardTitle>HSN Management</CardTitle>
            <CardDescription>Manage Harmonized System of Nomenclature (HSN) codes</CardDescription>
          </CardHeader>
          <div className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <Input
                placeholder="Search by HSN code or description"
                value={q}
                onChange={(e) => { setQ(e.target.value) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchList() } }}
                className="min-w-[320px]"
              />
              <Button onClick={() => fetchList()}>Search</Button>
              <Button onClick={() => { setQ(''); setPageNumber(0); fetchList() }}>Clear</Button>
              <Button onClick={openCreate}>Add HSN</Button>
            </div>

            {isLoading ? (
              <div className="py-12 flex justify-center"><LoadingSpinner text="Loading HSN records..." /></div>
            ) : error ? (
              <ErrorAlert error={error} onRetry={fetchList} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>HSN Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Portal Description</TableHead>
                    <TableHead>Unit Quantity</TableHead>
                    <TableHead>IGST</TableHead>
                    <TableHead>CGST</TableHead>
                    <TableHead>SGST</TableHead>
                    <TableHead>Comp. Cess</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="text-xs font-mono">{it.id}</TableCell>
                      <TableCell>{it.hsnCode}</TableCell>
                      <TableCell>{it.description}</TableCell>
                      <TableCell>{it.portalDescription ?? ''}</TableCell>
                      <TableCell>{it.uqc}</TableCell>
                      <TableCell>{it.igstRate ?? ''}</TableCell>
                      <TableCell>{it.cgstRate ?? ''}</TableCell>
                      <TableCell>{it.sgstRate ?? ''}</TableCell>
                      <TableCell>{it.compensationCess ?? ''}</TableCell>
                      <TableCell className="text-right">-</TableCell>
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
        </Card>

        <Sheet open={formOpen} onOpenChange={(v) => setFormOpen(v)}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Add HSN</SheetTitle>
              <SheetDescription>Create a new HSN record</SheetDescription>
            </SheetHeader>
            <form onSubmit={submitForm} className="p-4 space-y-3">
              <div>
                <Label>HSN Code</Label>
                <Input required value={String(formValues.hsnCode || '')} onChange={(e) => setFormValues((s: any) => ({ ...s, hsnCode: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={String(formValues.description || '')} onChange={(e) => setFormValues((s: any) => ({ ...s, description: e.target.value }))} />
              </div>
              <div>
                <Label>Portal Description</Label>
                <Input value={String(formValues.portalDescription || '')} onChange={(e) => setFormValues((s: any) => ({ ...s, portalDescription: e.target.value }))} />
              </div>
              <div>
                <Label>Unit Quantity</Label>
                <Input value={String(formValues.uqc || '')} onChange={(e) => setFormValues((s: any) => ({ ...s, uqc: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>IGST Rate</Label>
                  <Input type="number" step="0.01" value={String(formValues.igstRate ?? 0)} onChange={(e) => setFormValues((s: any) => ({ ...s, igstRate: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Compensation Cess</Label>
                  <Input required type="number" step="0.01" value={String(formValues.compensationCess ?? 0)} onChange={(e) => setFormValues((s: any) => ({ ...s, compensationCess: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!formValues.isReportableB2B} onChange={(e) => setFormValues((s: any) => ({ ...s, isReportableB2B: e.target.checked }))} /> <span>Reportable B2B</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!formValues.isReportableB2C} onChange={(e) => setFormValues((s: any) => ({ ...s, isReportableB2C: e.target.checked }))} /> <span>Reportable B2C</span></label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create'}</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </RequireAuth>
  )
}
