"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { buildApiUrl } from '@/lib/api-config'
import { signinPath } from '@/lib/appPaths'

export default function BrandsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create'|'edit'>('create')
  const [formValues, setFormValues] = useState<any>({ isActive: true })
  const [saving, setSaving] = useState(false)

  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push(signinPath())
    if (status === 'authenticated' && String((session as any)?.user?.role || '').toLowerCase() !== 'admin') router.push('/')
  }, [status, session, router])

  useEffect(() => { if (status === 'authenticated') fetchList() }, [status])

  async function fetchList() {
    setLoading(true)
    try {
      const url = buildApiUrl('/api/v1/brands')
      const r = await fetch(url, { credentials: 'same-origin' })
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()
      // Accept paged or array
      if (data && data.content) setItems(data.content)
      else if (Array.isArray(data)) setItems(data)
      else setItems([])
    } catch (err) {
      setItems([])
    } finally { setLoading(false) }
  }

  function openCreate() {
    setFormMode('create')
    setFormValues({ isActive: true })
    setFormOpen(true)
  }

  function openEdit(item: any) {
    setFormMode('edit')
    setFormValues({ ...item })
    setFormOpen(true)
  }

  async function submitForm(e?: React.FormEvent) {
    e?.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: String(formValues.name || ''),
        description: formValues.description || undefined,
        logoUrl: formValues.logoUrl || undefined,
        isActive: !!formValues.isActive,
        isGlobal: !!formValues.isGlobal
      }
      let r: Response
      if (formMode === 'create') {
        const url = buildApiUrl('/api/v1/brands')
        r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
      } else {
        const id = formValues.id
        if (!id) throw new Error('Missing id')
        const url = buildApiUrl(`/api/v1/brands/${id}`)
        r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
      }
      if (!r.ok) throw new Error(await r.text())
      await r.json()
      toast.success(formMode === 'create' ? 'Brand created' : 'Brand updated')
      setFormOpen(false)
      fetchList()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-0">
      <Card>
        <CardHeader>
          <CardTitle>Brands</CardTitle>
          <CardDescription>Manage product brands</CardDescription>
        </CardHeader>
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <Button onClick={openCreate}>Add New Brand</Button>
            <Button onClick={fetchList}>Refresh</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Global</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs font-mono">{b.id}</TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell className="text-xs">{b.logoUrl || ''}</TableCell>
                  <TableCell>{b.isGlobal ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-xs">{b.ownerId || ''}</TableCell>
                  <TableCell>{b.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-xs">{b.createdAt ? new Date(b.createdAt).toLocaleString() : ''}</TableCell>
                  <TableCell className="text-xs">{b.updatedAt ? new Date(b.updatedAt).toLocaleString() : ''}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button onClick={() => openEdit(b)} variant="outline">Edit</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{formMode === 'create' ? 'Create Brand' : 'Edit Brand'}</SheetTitle>
            <SheetDescription>Provide brand details</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitForm} className="space-y-4 p-4">
            <div>
              <Label>Name</Label>
              <Input value={formValues.name || ''} onChange={(e) => setFormValues({ ...formValues, name: e.target.value })} required />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={formValues.description || ''} onChange={(e) => setFormValues({ ...formValues, description: e.target.value })} />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input value={formValues.logoUrl || ''} onChange={(e) => setFormValues({ ...formValues, logoUrl: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <Checkbox checked={!!formValues.isActive} onCheckedChange={(v) => setFormValues({ ...formValues, isActive: !!v })} />
              <Label>Active</Label>
              <Checkbox checked={!!formValues.isGlobal} onCheckedChange={(v) => setFormValues({ ...formValues, isGlobal: !!v })} />
              <Label>Global</Label>
            </div>
            <SheetFooter>
              <div className="flex gap-2 justify-end">
                <Button type="submit">Save</Button>
                <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
