"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RequireAuth from '@/components/require-auth'
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
import { api } from '@/lib/apiClient'
import { signinPath } from '@/lib/appPaths'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchList()
  }, [page, size, query])

  // rely on server middleware + RequireAuth for auth checks

  async function fetchList() {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/admin/customers', { params: { page, size, ...(query && { q: query }) } })
      const res = response.data
      setCustomers(res.data || res.content || [])
      setTotal(res.total || res.totalElements || 0)
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
      const r = await api.put('/admin/customers', { id, status: newStatus })
      const updated = r.data
      setCustomers((s) => s.map((c: any) => c.id === id ? updated : c))
    } catch (e) {
      setError(formatErrorMessage(e))
    } finally {
      setUpdatingId(null)
    }
  }

  function renderPagination() {
    const pages = Math.max(1, Math.ceil(total / size))
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
            disabled={page >= pages - 1}
            size="sm"
          >
            Next
          </Button>
          <select value={size} onChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0) }} className="border rounded px-2 py-1 text-sm bg-background">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    )
  }

  return (
    <RequireAuth>
      <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">Manage all customers in your system</p>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchList} />}

      <form onSubmit={(e) => { e.preventDefault(); setPage(0); fetchList() }} className="flex gap-2">
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
    </RequireAuth>
  )
}