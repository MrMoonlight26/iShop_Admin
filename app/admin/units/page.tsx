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

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([])
  const [name, setName] = useState('')
  const [short, setShort] = useState('')
  // Accept free-form value input (string) and parse if numeric
  const [valueInput, setValueInput] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editShort, setEditShort] = useState('')
  const [editValueInput, setEditValueInput] = useState('')

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
    fetch('/api/admin/units', { credentials: 'same-origin' }).then(async (r) => {
      if (!r.ok) return setUnits([])
      const data = await r.json()
      setUnits(data)
    })
  }, [])

  async function createUnit(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)
    // determine whether input is numeric or raw string
    const parsed = (() => {
      const s = String(valueInput).trim()
      if (!s) return { number: null, raw: '' }
      const n = Number(s)
      if (!Number.isNaN(n)) return { number: n, raw: '' }
      return { number: null, raw: s }
    })()

    if (parsed.number === null && parsed.raw === '') {
      toast.error('Please provide a numeric value (>0) or a non-empty string')
      setIsCreating(false)
      return
    }

    const body: any = { name, short }
    if (parsed.number !== null) body.value = parsed.number
    if (parsed.raw) body.valueRaw = parsed.raw

    const promise = fetch('/api/admin/units', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) }).then(async (res) => {
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    })

    try {
      const newUnit = await toast.promise(promise, {
        loading: 'Creating unit...',
        success: 'Unit created',
        error: (err) => `Create failed: ${err?.message || err}`,
      })
      setUnits((s: any[]) => [...s, newUnit])
      setName('')
      setShort('')
      setValueInput('')
      // notify other admin pages (catalog) to refresh units
      try { window.dispatchEvent(new CustomEvent('units:updated', { detail: { action: 'create', unit: newUnit } })) } catch (e) { /* noop in SSR or non-window env */ }
    } catch (err) {
      // handled by toast
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(unit: any) {
    setEditingId(unit.id)
    setEditName(unit.name)
    setEditShort(unit.short || '')
    // prefer valueRaw if present; otherwise use numeric as string
    setEditValueInput(unit.valueRaw ?? (typeof unit.value === 'number' ? String(unit.value) : ''))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditShort('')
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSavingId(editingId)

    const parsed = (() => {
      const s = String(editValueInput ?? '').trim()
      if (!s) return { number: null, raw: '' }
      const n = Number(s)
      if (!Number.isNaN(n)) return { number: n, raw: '' }
      return { number: null, raw: s }
    })()

    if (parsed.number === null && parsed.raw === '') {
      toast.error('Please provide a numeric value (>0) or a non-empty string')
      setSavingId(null)
      return
    }

    const body: any = { id: editingId, name: editName, short: editShort }
    if (parsed.number !== null) body.value = parsed.number
    if (parsed.raw) body.valueRaw = parsed.raw

    const promise = fetch('/api/admin/units', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) }).then(async (res) => {
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    })

    try {
      const updated = await toast.promise(promise, {
        loading: 'Saving unit...',
        success: 'Unit updated',
        error: (err) => `Update failed: ${err?.message || err}`,
      })
      // refresh list after update to avoid local merge complexity
      try {
        const listRes = await fetch('/api/admin/units', { credentials: 'same-origin' })
        if (listRes.ok) {
          const list = await listRes.json()
          setUnits(list)
          try { window.dispatchEvent(new CustomEvent('units:updated', { detail: { action: 'update' } })) } catch (e) {}
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

  async function deleteUnit(id: string) {
    if (!confirm('Delete this unit?')) return
    setDeletingId(id)
    const promise = fetch('/api/admin/units', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id }) }).then(async (res) => {
      if (!res.ok) throw new Error(await res.text())
      return true
    })

    try {
      await toast.promise(promise, {
        loading: 'Deleting unit...',
        success: 'Unit deleted',
        error: (err) => `Delete failed: ${err?.message || err}`,
      })
      setUnits((units as any[]).filter((u: any) => (u as any).id !== id))
      try { window.dispatchEvent(new CustomEvent('units:updated', { detail: { action: 'delete', id } })) } catch (e) {}
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
          <CardTitle>Unit Types</CardTitle>
          <CardDescription>Manage central unit types used across products</CardDescription>
        </CardHeader>
        <div className="p-4">
          <form onSubmit={createUnit} className="mb-4 flex gap-2">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Short" value={short} onChange={(e) => setShort(e.target.value)} className="w-24" />
            <Input placeholder="Value (number or text)" value={valueInput} onChange={(e) => setValueInput(e.target.value)} className="w-36" />
            <Button type="submit" disabled={isCreating || !(name.trim() && (valueInput.trim().length > 0))}>{isCreating ? 'Creating...' : 'Create'}</Button>
          </form>
          {!(name.trim() && (valueInput.trim().length > 0)) && (
            <div className="text-sm text-red-500 mt-1">Name and Value (number or non-empty text) are required to create a unit.</div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Short</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>
                    {editingId === u.id ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      u.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === u.id ? (
                      <Input value={editShort} onChange={(e) => setEditShort(e.target.value)} className="w-24" />
                    ) : (
                      u.short
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === u.id ? (
                      <div>
                        <Input value={editValueInput} onChange={(e) => setEditValueInput(e.target.value)} className="w-28" required />
                        {!(editValueInput.trim().length > 0) && <div className="text-sm text-red-500 mt-1">Value is required</div>}
                      </div>
                    ) : (
                      (typeof u.value === 'number' ? String(u.value) : (u.valueRaw ?? ''))
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === u.id ? (
                      <div className="flex gap-2 justify-end">
                        <Button onClick={saveEdit} className="bg-green-600" disabled={savingId === editingId || !(editValueInput.trim().length > 0)}>{savingId === editingId ? 'Saving...' : 'Save'}</Button>
                        <Button onClick={cancelEdit} variant="secondary">Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <Button onClick={() => startEdit(u)} variant="outline">Edit</Button>
                        <Button onClick={() => deleteUnit(u.id)} className="bg-red-600" disabled={deletingId === u.id}>{deletingId === u.id ? 'Deleting...' : 'Delete'}</Button>
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
