"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([])
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status === 'authenticated' && (session as any)?.user?.role !== 'ADMIN') router.push('/')
  }, [status, session])

  if (status === 'loading') return null

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [query, setQuery] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchList()
  }, [page, limit, query])

  async function fetchList() {
    const params = new URLSearchParams()
    if (page) params.set('page', String(page))
    if (limit) params.set('limit', String(limit))
    if (query) params.set('q', query)
    const r = await fetch('/api/admin/shops?' + params.toString(), { credentials: 'same-origin' })
    if (!r.ok) return setShops([])
    const raw = await r.json()

    // Support different pagination shapes: sample uses `content` with page metadata
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

    // total can be in different fields depending on API
    const totalElements = raw.totalElements ?? raw.total ?? raw.totalShops ?? raw.total ?? 0
    setTotal(totalElements)

    // if API provides page info (0-based `number`), sync local page
    if (typeof raw.number === 'number') setPage((raw.number ?? 0) + 1)
    if (typeof raw.pageable?.pageNumber === 'number') setPage(raw.pageable.pageNumber + 1)
  }

  async function setStatus(id: string, status: string) {
    if (!confirm('Change shop status?')) return
    try {
      const r = await fetch('/api/admin/shops', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id, status }) })
      if (!r.ok) throw new Error(await r.text())
      const updated = await r.json()
      setShops((s: any[]) => s.map((sh: any) => sh.id === id ? updated : sh))
      alert('Status updated')
    } catch (err) {
      alert('Update failed')
    }
  }

  async function setApproval(id: string, approval: string) {
    if (!confirm('Change approval state?')) return
    try {
      const r = await fetch('/api/admin/shops', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id, approval }) })
      if (!r.ok) throw new Error(await r.text())
      const updated = await r.json()
      setShops((s: any[]) => s.map((sh: any) => sh.id === id ? updated : sh))
      alert('Approval updated')
    } catch (err) {
      alert('Update failed')
    }
  }

  function renderPagination() {
    const pages = Math.max(1, Math.ceil(total / limit))
    return (
      <div className="flex items-center gap-2 mt-4">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 border rounded">Prev</button>
        <div>Page {page} of {pages}</div>
        <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-2 py-1 border rounded">Next</button>
        <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1) }} className="border rounded px-2 py-1">
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

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchList() }} className="mb-4 flex gap-2">
        <input placeholder="Search shops by name, owner, or area" value={query} onChange={(e) => setQuery(e.target.value)} className="border rounded px-3 py-2 flex-1" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
      </form>

          <div className="text-sm text-muted-foreground mb-2">Total: {total}</div>

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
                  <select value={s.status || 'ACTIVE'} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); setStatus(s.id, e.target.value) }} className="border rounded px-2 py-1 text-sm">
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="BLOCKED">Blocked</option>
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
    </div>
  )
}