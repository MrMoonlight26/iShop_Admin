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

  if (!session || String((session as any).user?.role || '').toLowerCase() !== 'admin') return null

  return (
    <div>
      <div onClick={() => setOpen((o) => !o)} className="cursor-pointer text-sm font-medium text-muted-foreground flex items-center justify-between">
        <span>Admin</span>
        <span className="text-xs">{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div className="mt-2 flex flex-col gap-1">
          <a href="/admin/catalog" className="px-2 py-1 rounded hover:bg-muted">Central Catalog</a>
          <a href="/dashboard" className="px-2 py-1 rounded hover:bg-muted">Dashboard</a>

          <div className="pl-0">
            <div className="px-2 py-1 rounded font-medium">Unit Management</div>
            <div className="ml-4 flex flex-col gap-1">
              <a href="/admin/units/classes" className="px-2 py-1 rounded hover:bg-muted text-sm">Unit Classes</a>
              <a href="/admin/units/types" className="px-2 py-1 rounded hover:bg-muted text-sm">Unit Types</a>
            </div>
          </div>

          <a href="/admin/shops" className="px-2 py-1 rounded hover:bg-muted">Shops</a>
          <a href="/admin/categories" className="px-2 py-1 rounded hover:bg-muted">Categories</a>
          <a href="/admin/brands" className="px-2 py-1 rounded hover:bg-muted">Brands</a>
          <a href="/admin/users" className="px-2 py-1 rounded hover:bg-muted">Users</a>
          <a href="/admin/customers" className="px-2 py-1 rounded hover:bg-muted">Customers</a>
        </div>
      )}
    </div>
  )
}
