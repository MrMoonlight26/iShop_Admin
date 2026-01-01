"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
export default function CatalogPage() {
  const [products, setProducts] = useState<any[]>([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [sku, setSku] = useState('')
  const [defaultUnitId, setDefaultUnitId] = useState<string | null>(null)

  const [units, setUnits] = useState<any[]>([])
  const [isUnitsLoading, setIsUnitsLoading] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editSku, setEditSku] = useState('')
  const [editDefaultUnitId, setEditDefaultUnitId] = useState<string | null>(null)

  // loading states
  const [isCreating, setIsCreating] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status === 'authenticated' && (session as any)?.user?.role !== 'ADMIN') router.push('/')
  }, [status, session])

  // Basic client-side check: show nothing while auth status unknown
  if (status === 'loading') return null

  useEffect(() => {
    // fetch products
    fetch('/api/admin/catalog', { credentials: 'same-origin' }).then(async (r) => {
      if (!r.ok) return setProducts([])
      const data = await r.json()
      setProducts(data)
    })

    // fetch unit types for selector with loading state and error handling
    fetchUnits()

    // listen for unit updates from Units admin page and refresh
    function onUnitsUpdated() {
      fetchUnits()
    }

    try {
      window.addEventListener('units:updated', onUnitsUpdated as any)
    } catch (e) {}

    return () => {
      try {
        window.removeEventListener('units:updated', onUnitsUpdated as any)
      } catch (e) {}
    }
  }, [])

  async function fetchUnits() {
    setIsUnitsLoading(true)
    try {
      const r = await fetch('/api/admin/units', { credentials: 'same-origin' })
      if (!r.ok) {
        setUnits([])
        return
      }
      const data = await r.json()
      setUnits(data)
      if (data && data.length && !defaultUnitId) setDefaultUnitId(data[0].id)
    } catch (e) {
      console.error('Failed to load units', e)
      setUnits([])
    } finally {
      setIsUnitsLoading(false)
    }
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)
    const promise = fetch('/api/admin/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name, description: desc, sku, defaultUnitId }) }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json()
    })

    try {
      const p = await toast.promise(promise, {
        loading: 'Creating product...',
        success: 'Product created',
        error: (err) => `Create failed: ${err?.message || err}`,
      })
      setProducts((s) => [...s, p])
      setName('')
      setDesc('')
      setSku('')
    } catch (err) {
      // handled by toast
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(p: any) {
    setEditingId(p.id)
    setEditName(p.name)
    setEditDesc(p.description || '')
    setEditSku(p.sku || '')
    setEditDefaultUnitId(p.defaultUnit?.id ?? null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditDesc('')
    setEditSku('')
    setEditDefaultUnitId(null)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSavingId(editingId)
    const promise = fetch('/api/admin/catalog', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: editingId, name: editName, description: editDesc, sku: editSku, defaultUnitId: editDefaultUnitId }) }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json()
    })

    try {
      const updated = await toast.promise(promise, {
        loading: 'Saving product...',
        success: 'Product updated',
        error: (err) => `Update failed: ${err?.message || err}`,
      })
      // refresh list after update to avoid local merge complexity
      try {
        const listRes = await fetch('/api/admin/catalog', { credentials: 'same-origin' })
        if (listRes.ok) {
          const list = await listRes.json()
          setProducts(list)
        }
      } catch (e) {
        // ignore refresh errors
      }
      cancelEdit()
    } catch (err) {
      // handled by toast
    } finally {
      setSavingId(null)
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    setDeletingId(id)
    const promise = fetch('/api/admin/catalog', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id }) }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return true
    })

    try {
      await toast.promise(promise, {
        loading: 'Deleting product...',
        success: 'Product deleted',
        error: (err) => `Delete failed: ${err?.message || err}`,
      })
      setProducts((products as any[]).filter((p: any) => (p as any).id !== id))
    } catch (err) {
      // handled by toast
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-0">
      <Card>
        <CardHeader>
          <CardTitle>Central Catalog</CardTitle>
          <CardDescription>Central product catalog shared across shops</CardDescription>
        </CardHeader>
        <div className="p-4">
          <form onSubmit={createProduct} className="mb-4 flex gap-2">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} className="w-32" />
            <select className="border-input rounded-md px-3 py-2 text-foreground" value={defaultUnitId ?? ''} onChange={(e) => setDefaultUnitId(e.target.value || null)} disabled={isUnitsLoading}>
              {isUnitsLoading ? (
                <option value="">Loading units...</option>
              ) : units.length === 0 ? (
                <option value="">No units available</option>
              ) : (
                <>
                  <option value="">No unit</option>
                  {units.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}{u.short ? ` (${u.short})` : ''}{typeof u.value === 'number' ? ` — ${u.value}` : (u.valueRaw ? ` — ${u.valueRaw}` : '')}</option>
                  ))}
                </>
              )}
            </select>
            <Input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <Button type="submit" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create'}</Button>
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Default unit</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {editingId === p.id ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      p.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === p.id ? (
                      <Input value={editSku} onChange={(e) => setEditSku(e.target.value)} className="w-32" />
                    ) : (
                      p.sku
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === p.id ? (
                      <select className="border-input rounded-md px-3 py-2 text-foreground" value={editDefaultUnitId ?? ''} onChange={(e) => setEditDefaultUnitId(e.target.value || null)} disabled={isUnitsLoading}>
                        {isUnitsLoading ? (
                          <option value="">Loading units...</option>
                        ) : units.length === 0 ? (
                          <option value="">No units available</option>
                        ) : (
                          <>
                            <option value="">No unit</option>
                            {units.map((u: any) => (
                              <option key={u.id} value={u.id}>{u.name}{u.short ? ` (${u.short})` : ''}{typeof u.value === 'number' ? ` — ${u.value}` : ''}</option>
                            ))}
                          </>
                        )}
                      </select>
                    ) : (
                      p.defaultUnit ? p.defaultUnit.name : ''
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === p.id ? (
                      <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                    ) : (
                      p.description
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === p.id ? (
                      <div className="flex gap-2 justify-end">
                        <Button onClick={saveEdit} className="bg-green-600" disabled={savingId === editingId}>{savingId === editingId ? 'Saving...' : 'Save'}</Button>
                        <Button onClick={cancelEdit} variant="secondary">Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <Button onClick={() => startEdit(p)} variant="outline">Edit</Button>
                        <Button onClick={() => deleteProduct(p.id)} className="bg-red-600" disabled={deletingId === p.id}>{deletingId === p.id ? 'Deleting...' : 'Delete'}</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <CardFooter />
      </Card>
    </div>
  )
}
