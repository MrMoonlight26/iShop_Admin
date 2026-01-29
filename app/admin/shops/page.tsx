"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LoadingSpinner, ErrorAlert } from '@/components/ui/loading-error'
import { formatErrorMessage } from '@/lib/api-helpers'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { buildApiUrl } from '@/lib/api-config'

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()
  // const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status === 'authenticated' && (session as any)?.user?.role !== 'ADMIN') router.push('/')
  }, [status, session, router])

  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [ownerTypeFilter, setOwnerTypeFilter] = useState('')
  const [totalElements, setTotalElements] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)

  if (status === 'loading') return null

  useEffect(() => {
    fetchList()
  }, [pageNumber, pageSize, query, statusFilter, ownerTypeFilter])

  async function fetchList() {
    try {
      setLoading(true)
      setError(null)
      const url = buildApiUrl('/api/v1/admin/shops', {
        page: pageNumber,
        size: pageSize,
        ...(query && { q: query }),
        ...(statusFilter && { status: statusFilter }),
        ...(ownerTypeFilter && { ownerType: ownerTypeFilter })
      })

      const r = await fetch(url, { credentials: 'same-origin' })
      if (!r.ok) throw new Error(`Failed to load shops: ${r.status}`)
      const raw = await r.json()

      const content = raw.content ?? raw.data ?? raw

      const items = (Array.isArray(content) ? content : [])
        .map((it: any) => ({
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
    } catch (err) {
      setError(formatErrorMessage(err))
      setShops([])
    } finally {
      setLoading(false)
    }
  }

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
      const url = `${API_BASE || ''}/api/v1/admin/shops/${shopId}/status`
      const r = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ shopId, status: target, reason: statusModalReason }) })
      if (!r.ok) {
        throw new Error(await r.text())
      }
      const updated = await r.json()
      setShops((s: any[]) => s.map((sh: any) => sh.id === shopId ? updated : sh))
      toast.success('Status updated')
      setStatusModalOpen(false)
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setStatusUpdating(false)
    }
  }

  async function setApproval(id: string, approval: string) {
    try {
      const url = `${API_BASE || ''}/api/v1/admin/shops/${id}/approval`
      const r = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ shopId: id, approval }) })
      if (!r.ok) throw new Error(await r.text())
      const updated = await r.json()
      setShops((s: any[]) => s.map((sh: any) => sh.id === id ? updated : sh))
      toast.success('Approval updated')
    } catch (err) {
      setError(formatErrorMessage(err))
    }
  }

  function renderPagination() {
    const pages = Math.max(1, totalPages ?? Math.max(1, Math.ceil((totalElements ?? 0) / pageSize)))
    return (
      <div className="flex items-center justify-between mt-6 gap-4">
        <div className="text-sm text-muted-foreground">Total: {totalElements ?? '—'}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
            disabled={pageNumber === 0}
            size="sm"
          >
            Prev
          </Button>
          <div className="text-sm min-w-max">Page {pageNumber + 1} of {pages}</div>
          <Button
            variant="outline"
            onClick={() => setPageNumber((p) => Math.min(pages - 1, p + 1))}
            disabled={pageNumber >= (pages - 1)}
            size="sm"
          >
            Next
          </Button>
          <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPageNumber(0) }} className="border rounded px-2 py-1 text-sm bg-background">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shop Management</h1>
        <p className="text-muted-foreground mt-1">Manage all shops in your system</p>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchList} />}

      <form onSubmit={(e) => { e.preventDefault(); setPageNumber(0); fetchList() }} className="flex gap-2 flex-wrap items-center">
        <Input
          placeholder="Search shops by name, owner, or area"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[240px]"
        />
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value === 'all' ? '' : value); setPageNumber(0) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">DRAFT</SelectItem>
            <SelectItem value="PENDING_APPROVAL">PENDING_APPROVAL</SelectItem>
            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
            <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
            <SelectItem value="BLOCKED">BLOCKED</SelectItem>
            <SelectItem value="APPROVED">APPROVED</SelectItem>
            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ownerTypeFilter} onValueChange={(value) => { setOwnerTypeFilter(value === 'all' ? '' : value); setPageNumber(0) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All owners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            <SelectItem value="RETAILER">RETAILER</SelectItem>
            <SelectItem value="WHOLESALER">WHOLESALER</SelectItem>
            <SelectItem value="DISTRIBUTOR">DISTRIBUTOR</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">Search</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => { setQuery(''); setStatusFilter(''); setOwnerTypeFilter(''); setPageNumber(0); fetchList() }}
        >
          Clear
        </Button>
      </form>

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner text="Loading shops..." />
        </div>
      ) : (
        <>
          {shops.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-muted-foreground">
                <p>No shops found</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {shops.map((s: any) => (
                <Card key={s.id} className="p-4">
                  <a href={`/admin/shops/${s.id}`} className="block hover:opacity-80">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{s.name}</div>
                        <div className="text-sm text-muted-foreground">{s.address || 'No address provided'}</div>
                        <div className="mt-2 text-sm">Owner: {s.owner?.name || '—'} {s.owner?.email ? `— ${s.owner.email}` : ''}</div>
                        <div className="mt-2 text-sm">Products: {(s._count && s._count.shopProducts) || 0} • Orders: {(s._count && s._count.orders) || 0}</div>
                        {s.ownerType && <Badge variant="secondary" className="mt-2">{s.ownerType}</Badge>}
                      </div>

                      <div className="flex flex-col items-end gap-3" onClick={(e) => e.preventDefault()}>
                        <Badge variant={s.status === 'ACTIVE' ? 'default' : s.status === 'PENDING_APPROVAL' ? 'secondary' : 'destructive'}>
                          {s.status || 'UNKNOWN'}
                        </Badge>
                        <Select value={s.status || 'ACTIVE'} onValueChange={(value) => openStatusModal(s, value)}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT">DRAFT</SelectItem>
                            <SelectItem value="PENDING_APPROVAL">PENDING_APPROVAL</SelectItem>
                            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                            <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                            <SelectItem value="BLOCKED">BLOCKED</SelectItem>
                            <SelectItem value="APPROVED">APPROVED</SelectItem>
                            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                          </SelectContent>
                        </Select>

                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Approval</div>
                          <Select value={s.approval || 'PENDING'} onValueChange={(value) => setApproval(s.id, value)}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="APPROVED">Approve</SelectItem>
                              <SelectItem value="REJECTED">Reject</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </a>
                </Card>
              ))}
            </div>
          )}

          {renderPagination()}
        </>
      )}

      {/* Status Change Modal */}
      <Sheet open={statusModalOpen} onOpenChange={(open) => { if (!open) { setStatusModalOpen(false); setStatusModalShop(null) } }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Change Shop Status</SheetTitle>
            <SheetDescription>Update status for the selected shop</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="font-medium">{statusModalShop?.name}</div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusModalTarget} onValueChange={setStatusModalTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">PENDING_APPROVAL</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  <SelectItem value="BLOCKED">BLOCKED</SelectItem>
                  <SelectItem value="APPROVED">APPROVED</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <textarea
                id="reason"
                value={statusModalReason}
                onChange={(e) => setStatusModalReason(e.target.value)}
                className="border rounded p-2 w-full h-24 text-sm bg-background"
                placeholder="Enter reason for status change..."
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setStatusModalOpen(false); setStatusModalShop(null) }}>Cancel</Button>
              <Button onClick={submitStatusChange} disabled={statusUpdating}>{statusUpdating ? 'Updating...' : 'Confirm'}</Button>
            </div>
          </div>
          <SheetFooter />
        </SheetContent>
      </Sheet>
    </div>
  )
}