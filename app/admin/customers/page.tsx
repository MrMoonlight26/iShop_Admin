"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner, ErrorAlert } from '@/components/ui/loading-error'
import { formatErrorMessage } from '@/lib/api-helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status === 'authenticated' && (session as any)?.user?.role !== 'ADMIN') router.push('/')
  }, [status, session, router])

  useEffect(() => {
    if (status === 'loading') return
    fetchList()
  }, [page, limit, query])

  async function fetchList() {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (query) params.set('q', query)
      const r = await fetch('/api/v1/admin/customers?' + params.toString(), { credentials: 'same-origin' })
      if (!r.ok) throw new Error(`Failed to load customers: ${r.status}`)
      const res = await r.json()
      setCustomers(res.data)
      setTotal(res.total)
    } catch (err) {
      setError(formatErrorMessage(err))
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  async function setStatus(id: string, newStatus: string) {
    if (!confirm('Change status?')) return
    try {
      setUpdatingId(id)
      const r = await fetch('/api/v1/admin/customers', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'same-origin', 
        body: JSON.stringify({ id, status: newStatus }) 
      })
      if (!r.ok) throw new Error(await r.text())
      const updated = await r.json()
      setCustomers((s) => s.map((c: any) => c.id === id ? updated : c))
    } catch (e) {
      setError(formatErrorMessage(e))
    } finally {
      setUpdatingId(null)
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            size="sm"
          >
            Prev
          </Button>
          <div className="text-sm min-w-max">Page {page} of {pages}</div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            size="sm"
          >
            Next
          </Button>
          <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1) }} className="border rounded px-2 py-1 text-sm bg-background">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    )
  }

  return (
    <>
      {status === 'loading' ? null : (
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage all customers in your system</p>
          </div>

          {error && <ErrorAlert error={error} onRetry={fetchList} />}

          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchList() }} className="flex gap-2">
            <Input
              placeholder="Search customers by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner text="Loading customers..." />
            </div>
          ) : (
            <>
              {customers.length === 0 ? (
                <Card>
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No customers found</p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-2">
                  {customers.map((c) => (
                    <Card key={c.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{c.name || c.email}</div>
                          <div className="text-sm text-muted-foreground">{c.email}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={c.status === 'ACTIVE' ? 'default' : c.status === 'PAUSED' ? 'secondary' : 'destructive'}>
                            {c.status || 'UNKNOWN'}
                      </Badge>
                      <Select value={c.status || 'ACTIVE'} onValueChange={(value) => setStatus(c.id, value)}>
                        <SelectTrigger className="w-32" disabled={updatingId === c.id}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="PAUSED">Paused</SelectItem>
                          <SelectItem value="BLOCKED">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
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
      )}
    </>
  )
}