"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [filterShop, setFilterShop] = useState<string | null>(null)
  const [filterPin, setFilterPin] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [windowFilter, setWindowFilter] = useState<'all'|'7'|'30'|'90'>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status === 'authenticated' && (session as any)?.user?.role !== 'ADMIN') router.push('/')
  }, [status, session])

  useEffect(() => {
    fetchList()
  }, [filterShop, filterPin, statusFilter, windowFilter, page, limit])

  const [shops, setShops] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/admin/shops?limit=100', { credentials: 'same-origin' }).then(async (r) => {
      if (!r.ok) return setShops([])
      const data = await r.json()
      setShops(data.data || data)
    })
  }, [])

  async function fetchList() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterShop) params.set('shopId', filterShop)
    if (filterPin) params.set('pinCode', filterPin)
    if (statusFilter) params.set('status', statusFilter)
    if (windowFilter && windowFilter !== 'all') {
      const days = parseInt(windowFilter, 10)
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      params.set('since', since)
    }
    params.set('page', String(page))
    params.set('limit', String(limit))

    try {
      const r = await fetch('/api/admin/orders?' + params.toString(), { credentials: 'same-origin' })
      if (!r.ok) return setOrders([])
      const data = await r.json()
      setOrders(data.data)
      setTotal(data.total)
    } catch (e) {
      setOrders([])
    } finally {
      setLoading(false)
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
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <div className="mb-4 flex gap-2">
        <select value={filterShop || ''} onChange={(e) => { setFilterShop(e.target.value || null); setPage(1) }} className="border rounded px-3 py-2">
          <option value="">All shops</option>
          {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input placeholder="Filter by pin" value={filterPin} onChange={(e) => setFilterPin(e.target.value)} className="border rounded px-3 py-2" />
        <select value={statusFilter || ''} onChange={(e) => { setStatusFilter(e.target.value || null); setPage(1) }} className="border rounded px-3 py-2">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={windowFilter} onChange={(e) => { setWindowFilter(e.target.value as any); setPage(1) }} className="border rounded px-3 py-2">
          <option value="all">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <button onClick={() => { setPage(1); fetchList() }} className="bg-blue-600 text-white px-4 py-2 rounded">Filter</button>
      </div>
      {loading ? <div>Loading…</div> : (
        <div>
          <div className="text-sm text-muted-foreground mb-2">Total: {total}</div>
          {orders.length === 0 ? <div>No orders</div> : (
            <ul>
              {orders.map((o) => (
                <li key={o.id} className="py-3 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">Order #{o.id}</div>
                      <div className="text-sm text-muted-foreground">Shop: {o.shop?.name || '—'} • Pin: {o.pinCode || '—'} • Area: {o.area || '—'}</div>
                      <div className="text-sm">Total: ₹{o.total}</div>
                    </div>
                    <div>
                      <div className={`px-2 py-1 rounded text-sm ${o.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{o.status}</div>
                    </div>
                  </div>
                  {o.items && o.items.length > 0 && (
                    <ul className="mt-2 pl-4">
                      {o.items.map((it: any) => (
                        <li key={it.id} className="text-sm">{it.name} — {it.quantity} {it.unit} • ₹{it.price}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}

          {renderPagination()}
        </div>
      )}
    </div>
  )
}