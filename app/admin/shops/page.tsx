"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([])
  const { data: session, status } = useSession()
  const router = useRouter()
  // API base (use NEXT_PUBLIC_API_BASE_URL to point to backend)
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status === 'authenticated' && (session as any)?.user?.role !== 'ADMIN') router.push('/')
  }, [status, session])

  if (status === 'loading') return null

  // pagination and filters
  const [pageNumber, setPageNumber] = useState(0) // 0-based
  const [pageSize, setPageSize] = useState(10)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [ownerTypeFilter, setOwnerTypeFilter] = useState('')
  const [totalElements, setTotalElements] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchList()
  }, [pageNumber, pageSize, query, statusFilter, ownerTypeFilter])

  async function fetchList() {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (typeof pageNumber === 'number') params.set('page', String(pageNumber)) // server expects 0-based
    if (pageSize) params.set('size', String(pageSize))
    if (query) params.set('q', query)
    if (statusFilter) params.set('status', statusFilter)
    if (ownerTypeFilter) params.set('ownerType', ownerTypeFilter)

    let url = `${API_BASE || ''}/api/admin/shops?${params.toString()}`
    // if API_BASE empty, fall back to proxied route
    if (!API_BASE) url = `/api/admin/shops?${params.toString()}`

    const r = await fetch(url, { credentials: 'same-origin' })
    if (!r.ok) { setShops([]); setIsLoading(false); return }
    const raw = await r.json()

    // Support paged API: { content, page }
    const content = raw.content ?? raw.data ?? raw

    const items = (Array.isArray(content) ? content : [])
      .map((it: any) => ({
        // normalize shopId/id
        id: it.id ?? it.shopId,
        shopId: it.shopId ?? it.id,
        name: it.name,
        status: it.status,
        approval: it.approval,
        owner: it.owner || (it.ownerName ? { name: it.ownerName, email: it.ownerEmail } : undefined),
        _count: it._count || it.counts || {},
        createdAt: it.createdAt,
        mobile: it.mobile,
        ownerType: it.ownerType,
        onlineEnabled: it.onlineEnabled,
        fulfillmentTypes: it.fulfillmentTypes,
      }))

    setShops(items)

    // populate pagination metadata when available
    if (raw.page) {
      setPageNumber(typeof raw.page.number === 'number' ? Number(raw.page.number) : 0)
      setPageSize(typeof raw.page.size === 'number' ? Number(raw.page.size) : pageSize)
      setTotalElements(typeof raw.page.totalElements === 'number' ? Number(raw.page.totalElements) : null)
      setTotalPages(typeof raw.page.totalPages === 'number' ? Number(raw.page.totalPages) : null)
    } else {
      const totalEl = raw.totalElements ?? raw.total ?? raw.totalShops ?? (Array.isArray(content) ? (content as any[]).length : 0)
      setTotalElements(typeof totalEl === 'number' ? totalEl : null)
      setTotalPages(totalEl && pageSize ? Math.max(1, Math.ceil(Number(totalEl) / pageSize)) : null)
    }

    setIsLoading(false)
  }

  // status change modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusModalShop, setStatusModalShop] = useState<any | null>(null)
  const [statusModalTarget, setStatusModalTarget] = useState<string>('')
  const [statusModalReason, setStatusModalReason] = useState<string>('')
  const [statusUpdating, setStatusUpdating] = useState(false)

  async function openStatusModal(shop: any, target: string) {
    setStatusModalShop(shop)
    setStatusModalTarget(target)
    setStatusModalReason('')
    setStatusModalOpen(true)
  }

  async function submitStatusChange() {
    if (!statusModalShop) return
    setStatusUpdating(true)
    const shopId = statusModalShop.id
    const target = statusModalTarget
    try {
      const url = `${API_BASE || ''}/api/admin/shops/${shopId}/status`
      const r = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ shopId, status: target, reason: statusModalReason }) })
      if (!r.ok) {
        throw new Error(await r.text())
      }
      const updated = await r.json()
      setShops((s: any[]) => s.map((sh: any) => sh.id === shopId ? updated : sh))
      toast.success('Status updated')
      setStatusModalOpen(false)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setStatusUpdating(false)
    }
  }

  async function setApproval(id: string, approval: string) {
    try {
      const url = `${API_BASE || ''}/api/admin/shops/${id}/approval`
      const r = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ shopId: id, approval }) })
      if (!r.ok) throw new Error(await r.text())
      const updated = await r.json()
      setShops((s: any[]) => s.map((sh: any) => sh.id === id ? updated : sh))
      toast.success('Approval updated')
    } catch (err) {
      toast.error('Update failed')
    }
  }

  function renderPagination() {
    const pages = Math.max(1, totalPages ?? Math.max(1, Math.ceil((totalElements ?? 0) / pageSize)))
    return (
      <div className="flex items-center gap-2 mt-4">
        <button onClick={() => { setPageNumber((p) => Math.max(0, p - 1)); fetchList() }} disabled={pageNumber === 0} className="px-2 py-1 border rounded">Prev</button>
        <div>Page {pageNumber + 1} of {pages}</div>
        <button onClick={() => { setPageNumber((p) => Math.min(pages - 1, p + 1)); fetchList() }} disabled={pageNumber >= (pages - 1)} className="px-2 py-1 border rounded">Next</button>
        <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPageNumber(0); fetchList() }} className="border rounded px-2 py-1">
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Shops</h1>

      <form onSubmit={(e) => { e.preventDefault(); setPageNumber(0); fetchList() }} className="mb-4 flex gap-2 flex-wrap items-center">
        <input placeholder="Search shops by name, owner, or area" value={query} onChange={(e) => setQuery(e.target.value)} className="border rounded px-3 py-2 flex-1 min-w-[240px]" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPageNumber(0) }} className="border rounded px-2 py-2">
          <option value="">All statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="BLOCKED">BLOCKED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <select value={ownerTypeFilter} onChange={(e) => { setOwnerTypeFilter(e.target.value); setPageNumber(0) }} className="border rounded px-2 py-2">
          <option value="">All owners</option>
          <option value="RETAILER">RETAILER</option>
          <option value="WHOLESALER">WHOLESALER</option>
          <option value="DISTRIBUTOR">DISTRIBUTOR</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
        <button type="button" onClick={() => { setQuery(''); setStatusFilter(''); setOwnerTypeFilter(''); setPageNumber(0); fetchList() }} className="px-3 py-2 border rounded">Clear</button>
      </form>

          <div className="text-sm text-muted-foreground mb-2">Total: {totalElements ?? '—'}</div>

      <ul>
        {shops.map((s: any) => (
          <li key={s.id} className="py-4 border-b">
            <a href={`/admin/shops/${s.id}`} className="block">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-muted-foreground">{s.address || 'No address provided'}</div>
                  <div className="mt-2 text-sm">Owner: {s.owner?.name || '—'} {s.owner?.email ? `— ${s.owner.email}` : ''}</div>
                  <div className="mt-2 text-sm">Products: {(s._count && s._count.shopProducts) || 0} • Orders: {(s._count && s._count.orders) || 0}</div>
                  {s.ownerType && <div className="mt-1 text-xs inline-block px-2 py-1 bg-gray-100 rounded text-muted-foreground">{s.ownerType}</div>}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className={`px-2 py-1 rounded text-sm ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : s.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{s.status || 'UNKNOWN'}</div>
                  <select value={s.status || 'ACTIVE'} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); openStatusModal(s, e.target.value) }} className="border rounded px-2 py-1 text-sm">
                    <option value="">Select status</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>

                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground">Approval</div>
                    <select value={s.approval || 'PENDING'} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); setApproval(s.id, e.target.value) }} className="border rounded px-2 py-1 text-sm">
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approve</option>
                      <option value="REJECTED">Reject</option>
                    </select>
                  </div>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>

      {renderPagination()}

      {/* Status Change Modal */}
      <Sheet open={statusModalOpen} onOpenChange={(open) => { if (!open) { setStatusModalOpen(false); setStatusModalShop(null) } }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Change Shop Status</SheetTitle>
            <SheetDescription>Update status for the selected shop</SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <div><strong>{statusModalShop?.name}</strong></div>
            <div>
              <Label>Status</Label>
              <select value={statusModalTarget} onChange={(e) => setStatusModalTarget(e.target.value)} className="border rounded px-2 py-1 w-full">
                <option value="">Select status</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <textarea value={statusModalReason} onChange={(e) => setStatusModalReason(e.target.value)} className="border rounded p-2 w-full h-24" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setStatusModalOpen(false); setStatusModalShop(null) }}>Cancel</Button>
              <Button onClick={submitStatusChange} disabled={statusUpdating}>{statusUpdating ? 'Updating...' : 'Confirm'}</Button>
            </div>
          </div>
          <SheetFooter />
        </SheetContent>
      </Sheet>
    </div>
  )
}