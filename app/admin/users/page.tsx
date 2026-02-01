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
import { buildApiUrl } from '@/lib/api-config'
import { signinPath } from '@/lib/appPaths'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const router = useRouter()

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchList()
  }, [page, size, query, statusFilter])

  // rely on server-side middleware + RequireAuth for auth checks

  async function fetchList() {
    try {
      setLoading(true)
      setError(null)
      // Use "APPROVED" as default if no filter selected
      const status = statusFilter === 'all' ? 'APPROVED' : statusFilter
      const endpoint = `/api/v1/admin/vendors/status/${status}`
      const response = await fetch(
        buildApiUrl(endpoint, {
          page,
          size,
          ...(query && { q: query })
        }),
        { credentials: 'same-origin' }
      )
      if (!response.ok) {
        throw new Error(`Failed to load vendors: ${response.status}`)
      }
      const res = await response.json()
      setUsers(res.content || [])
      setTotal(res.totalElements || 0)
    } catch (err) {
      setError(formatErrorMessage(err))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  async function setStatus(vendorId: string, newStatus: string) {
    if (!confirm(`Change status to ${newStatus}?`)) return
    try {
      setUpdatingId(vendorId)
      let endpoint = ''
      if (newStatus === 'SUSPENDED') {
        endpoint = `/api/v1/admin/vendors/${vendorId}/suspend`
      } else if (newStatus === 'APPROVED') {
        endpoint = `/api/v1/admin/vendors/${vendorId}/approve`
      } else {
        setError('Invalid status action')
        return
      }
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      })
      if (!response.ok) throw new Error(await response.text())
      const updated = await response.json()
      setUsers((s: any[]) => s.map((u: any) => u.id === vendorId ? updated : u))
    } catch (err) {
      setError(formatErrorMessage(err))
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
        <h1 className="text-3xl font-bold tracking-tight">Vendors Management</h1>
        <p className="text-muted-foreground mt-1">Manage all vendors in your system</p>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchList} />}

      <form onSubmit={(e) => { e.preventDefault(); setPage(0); fetchList() }} className="flex gap-2 flex-wrap items-center">
        <Input
          placeholder="Search vendors by name or mobile"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[240px]"
        />
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(0) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner text="Loading vendors..." />
        </div>
      ) : (
        <>
          {users.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-muted-foreground">
                <p>No vendors found</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {users.map((u: any) => (
                <Card key={u.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-muted-foreground">{u.mobile}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        u.status === 'APPROVED' ? 'default' : 
                        u.status === 'PENDING_APPROVAL' ? 'secondary' : 
                        u.status === 'SUSPENDED' ? 'outline' :
                        'destructive'
                      }>
                        {u.status || 'UNKNOWN'}
                      </Badge>
                      {u.status === 'PENDING_APPROVAL' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setStatus(u.id, 'APPROVED')}
                          disabled={updatingId === u.id}
                        >
                          Approve
                        </Button>
                      )}
                      {u.status === 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setStatus(u.id, 'SUSPENDED')}
                          disabled={updatingId === u.id}
                        >
                          Suspend
                        </Button>
                      )}
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