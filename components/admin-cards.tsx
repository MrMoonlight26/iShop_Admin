"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function AdminCards() {
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    fetch('/api/admin/summary', { credentials: 'same-origin' })
      .then(async (r) => {
        if (!r.ok) return setSummary(null)
        const data = await r.json()
        setSummary(data)
      })
      .catch(() => setSummary(null))
  }, [])

  const items = [
    { title: 'Products', key: 'productCount', href: '/admin/catalog' },
    { title: 'Unit Types', key: 'unitCount', href: '/admin/units' },
    { title: 'Shops', key: 'shopCount', href: '/admin/shops' },
    { title: 'Vendors', key: 'vendorCount', href: '/admin/users' },
    { title: 'Orders', key: 'orderCount', href: '/admin/orders' },
  ]

  async function exportOrders() {
    try {
      const r = await fetch('/api/admin/orders/export', { credentials: 'same-origin' })
      if (!r.ok) { alert('Export failed'); return }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'orders.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Export failed')
    }
  }

  function renderExtra(it: any) {
    if (!summary) return null
    if (it.key === 'orderCount') return (
      <div className="mt-3 text-sm">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="p-2 border rounded">
            <div className="text-xs text-muted-foreground">Orders (7d)</div>
            <div className="font-medium">{summary.totals?.week?.count ?? 0}</div>
            <div className="text-xs">₹{summary.totals?.week?.totalValue?.toFixed ? summary.totals.week.totalValue.toFixed(0) : summary.totals?.week?.totalValue ?? 0}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="text-xs text-muted-foreground">Orders (30d)</div>
            <div className="font-medium">{summary.totals?.month?.count ?? 0}</div>
            <div className="text-xs">₹{summary.totals?.month?.totalValue?.toFixed ? summary.totals.month.totalValue.toFixed(0) : summary.totals?.month?.totalValue ?? 0}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="text-xs text-muted-foreground">Orders (90d)</div>
            <div className="font-medium">{summary.totals?.months3?.count ?? 0}</div>
            <div className="text-xs">₹{summary.totals?.months3?.totalValue?.toFixed ? summary.totals.months3.totalValue.toFixed(0) : summary.totals?.months3?.totalValue ?? 0}</div>
          </div>
        </div>

        <div className="font-medium">Top shops</div>
        <ul className="mt-1 space-y-1">
          {(summary.byShop || []).map((s: any) => (
            <li key={s.shopId} className="flex items-center justify-between text-sm">
              <span>{s.shopName}</span>
              <span className="text-muted-foreground">{s.count}</span>
            </li>
          ))}
        </ul>

        <div className="mt-2 font-medium">Top pins</div>
        <ul className="mt-1 space-y-1">
          {(summary.byPin || []).map((p: any) => (
            <li key={p.pinCode} className="flex items-center justify-between text-sm">
              <span>{p.pinCode}</span>
              <span className="text-muted-foreground">{p.count}</span>
            </li>
          ))}
        </ul>

        <div className="mt-2 font-medium">Top areas</div>
        <ul className="mt-1 space-y-1">
          {(summary.byArea || []).map((a: any) => (
            <li key={a.area} className="flex items-center justify-between text-sm">
              <span>{a.area}</span>
              <span className="text-muted-foreground">{a.count}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3">
          <button onClick={exportOrders} className="text-primary hover:underline">Export CSV</button>
        </div>
      </div>
    )

    if (it.key === 'shopCount') return (
      <div className="mt-3 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 border rounded">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="font-medium">{summary.totalShops ?? summary.shopCount ?? 0}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="text-xs text-muted-foreground">Active</div>
            <div className="font-medium">{summary.activeShops ?? 0}</div>
          </div>
          <div className="p-2 border rounded">
            <div className="text-xs text-muted-foreground">Inactive</div>
            <div className="font-medium">{summary.inactiveShops ?? 0}</div>
          </div>
        </div>
      </div>
    )

    return null
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {items.map((it) => (
        <Card key={it.key} className="@container/card">
          <CardHeader>
            <CardDescription>{it.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {summary ? summary[it.key] : '—'}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">Admin</Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex items-center">
            <div className="flex-1">
              <Link href={it.href} className="text-primary hover:underline">
                Manage {it.title}
              </Link>
              {renderExtra(it)}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
