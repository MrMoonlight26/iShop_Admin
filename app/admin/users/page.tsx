"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
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

  useEffect(() => {
    fetchList()
  }, [page, limit, query])

  async function fetchList() {
    const params = new URLSearchParams()
    if (page) params.set('page', String(page))
    if (limit) params.set('limit', String(limit))
    if (query) params.set('q', query)
    const r = await fetch('/api/admin/users?' + params.toString(), { credentials: 'same-origin' })
    if (!r.ok) return setUsers([])
    const res = await r.json()
    setUsers(res.data)
    setTotal(res.total)
  }

  async function setStatus(id: string, status: string) {
    if (!confirm('Change status?')) return
    try {
      const r = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id, status }) })
      if (!r.ok) throw new Error(await r.text())
      const updated = await r.json()
      setUsers((s: any[]) => s.map((u: any) => u.id === id ? updated : u))
      alert('Status updated')
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
      <h1 className="text-2xl font-bold mb-4">Users</h1>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchList() }} className="mb-4 flex gap-2">
        <input placeholder="Search users by name or email" value={query} onChange={(e) => setQuery(e.target.value)} className="border rounded px-3 py-2 flex-1" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
      </form>

      <div className="text-sm text-muted-foreground mb-2">Total: {total}</div>

      <ul>
        {users.map((u: any) => (
          <li key={u.id} className="py-2 border-b flex items-center justify-between">
            <div>{u.name} — {u.email} <span className="ml-2 text-sm text-muted-foreground">({u.role})</span></div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded text-sm ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : u.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{u.status || 'UNKNOWN'}</div>
              <select value={u.status || 'ACTIVE'} onChange={(e) => setStatus(u.id, e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </li>
        ))}
      </ul>

      {renderPagination()}
    </div>
  )
}