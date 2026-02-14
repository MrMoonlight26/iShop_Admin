"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner, ErrorAlert } from '@/components/ui/loading-error'
import { formatErrorMessage } from '@/lib/api-helpers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import RequireAuth from '@/components/require-auth'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/apiClient'
import { signinPath } from '@/lib/appPaths'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [filterShop, setFilterShop] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [windowFilter, setWindowFilter] = useState<'all'|'7'|'30'|'90'>('all')
  const [shops, setShops] = useState<any[]>([])
  const [filterPin, setFilterPin] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [limit, setLimit] = useState<number>(20)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState<number>(0)
  // rely on server middleware + RequireAuth for auth checks
  

  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push(signinPath())
    if (status === 'authenticated' && String((session as any)?.user?.role || '').toLowerCase() !== 'admin') router.push('/')
  }, [status, session, router])

  useEffect(() => {
    api.get('/admin/shops', { params: { limit: 100 } }).then((r) => {
      const data = r.data
      setShops(data.data || data)
    }).catch(() => setShops([]))
  }, [])

  useEffect(() => {
    fetchList()
  }, [filterShop, filterPin, statusFilter, windowFilter, page, limit])

  if (status === 'loading') return null

  async function fetchList() {
    try {
      setLoading(true)
      setError(null)
      const params: Record<string, string | number> = {}
      if (filterShop) params['shopId'] = filterShop
      if (filterPin) params['pinCode'] = filterPin
      if (statusFilter) params['status'] = statusFilter
      if (windowFilter && windowFilter !== 'all') {
        const days = parseInt(windowFilter, 10)
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        params['since'] = since
      }
      params['page'] = String(page)
      params['limit'] = String(limit)

      const r = await api.get('/admin/orders', { params })
      const data = r.data
      setOrders(data.data)
      setTotal(data.total)
    } catch (err) {
      setError(formatErrorMessage(err))
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  function renderPagination() {
    const pages = Math.max(1, Math.ceil(total / limit))
    return (
      <div className="flex items-center justify-between mt-6 gap-4">
        <div className="text-sm text-muted-foreground">Total: {total}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            size="sm"
          >
            Prev
          </Button>
          <div className="text-sm min-w-max">Page {page + 1} of {pages}</div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page === pages - 1}
            size="sm"
          >
            Next
          </Button>
          <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0) }} className="border rounded px-2 py-1 text-sm bg-background">
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
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage and track customer orders</p>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchList} />}

      <div className="flex gap-2 flex-wrap items-center">
        <Select value={filterShop || 'all'} onValueChange={(value) => { setFilterShop(value === 'all' ? null : value); setPage(0) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All shops" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All shops</SelectItem>
            {shops.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filter by pin code"
          value={filterPin ?? ''}
          onChange={(e) => setFilterPin(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter || 'all'} onValueChange={(value) => { setStatusFilter(value === 'all' ? null : value); setPage(0) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={windowFilter} onValueChange={(value) => { setWindowFilter(value as any); setPage(0) }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setPage(0); fetchList() }} variant="secondary">
          Filter
        </Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner text="Loading orders..." />
        </div>
      ) : (
        <>
          {orders.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-muted-foreground">
                <p>No orders found</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Card key={o.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">Order #{o.id}</div>
                      <div className="text-sm text-muted-foreground mt-1">Shop: {o.shop?.name || '—'} • Pin: {o.pinCode || '—'} • Area: {o.area || '—'}</div>
                      <div className="text-sm font-medium mt-2">Total: ₹{o.total}</div>
                      {o.items && o.items.length > 0 && (
                        <div className="mt-3 space-y-1 border-t pt-2">
                          {o.items.map((it: any) => (
                            <div key={it.id} className="text-sm text-muted-foreground">
                              {it.name} — {it.quantity} {it.unit} • ₹{it.price}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Badge variant={o.status === 'COMPLETED' ? 'default' : o.status === 'PENDING' ? 'secondary' : 'destructive'}>
                        {o.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {renderPagination()}
        </>
      )}
    </div>
  )
}