"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const STORAGE_KEY = 'adminLinksOpen'

export function AdminLinks() {
  const { data: session } = useSession()
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'true') } catch { return true }
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(open)) } catch {}
  }, [open])

  if (!session || (session as any).user?.role !== 'ADMIN') return null

  return (
    <div>
      <div onClick={() => setOpen((o) => !o)} className="cursor-pointer text-sm font-medium text-muted-foreground flex items-center justify-between">
        <span>Admin</span>
        <span className="text-xs">{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div className="mt-2 flex flex-col gap-1">
          <a href="/admin/catalog" className="px-2 py-1 rounded hover:bg-muted">Central Catalog</a>
          <a href="/admin/units" className="px-2 py-1 rounded hover:bg-muted">Unit Types</a>
          <a href="/admin/shops" className="px-2 py-1 rounded hover:bg-muted">Shops</a>
          <a href="/admin/categories" className="px-2 py-1 rounded hover:bg-muted">Categories</a>
          <a href="/admin/users" className="px-2 py-1 rounded hover:bg-muted">Users</a>
          <a href="/admin/customers" className="px-2 py-1 rounded hover:bg-muted">Customers</a>
        </div>
      )}
    </div>
  )
}
