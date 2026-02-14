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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { api } from '@/lib/apiClient'
import { signinPath } from '@/lib/appPaths'
export default function CatalogPage() {
  const [products, setProducts] = useState<any[]>([])

  // Create product sheet state
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createSku, setCreateSku] = useState('')
  const [createCategoryId, setCreateCategoryId] = useState<string | null>(null)
  const [createUnitTypeId, setCreateUnitTypeId] = useState<string | null>(null)
  const [createUnitQuantityValue, setCreateUnitQuantityValue] = useState<number | ''>('')
  const [createBarcode, setCreateBarcode] = useState('')
  const [createImageUrl, setCreateImageUrl] = useState('')
  const [createBrand, setCreateBrand] = useState('')
  const [createManufacturer, setCreateManufacturer] = useState('')
  const [createOriginCountry, setCreateOriginCountry] = useState('')
  const [createTagsText, setCreateTagsText] = useState('')
  const [createAdditionalInfo, setCreateAdditionalInfo] = useState('')
  const [createActive, setCreateActive] = useState(true)

  const [units, setUnits] = useState<any[]>([])
  const [isUnitsLoading, setIsUnitsLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)


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
    if (status === 'unauthenticated') router.push(signinPath())
    if (status === 'authenticated' && String((session as any)?.user?.role || '').toLowerCase() !== 'admin') router.push('/')
  }, [status, session, router])

  // pagination/search state
  const [pageNumber, setPageNumber] = useState(0) // 0-based
  const [pageSize, setPageSize] = useState(10)
  const [query, setQuery] = useState('')
  const [totalElements, setTotalElements] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchList()
    fetchUnits()
    fetchCategories()

    // listen for unit updates from Units admin page and refresh
    function onUnitsUpdated() {
      fetchUnits()
      fetchCategories()
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

  useEffect(() => {
    fetchList()
  }, [pageNumber, pageSize, query])

  // Basic client-side check: show nothing while auth status unknown
  if (status === 'loading') return null

  async function fetchList() {
    setIsLoading(true)
    const params: Record<string, string | number> = {
      page: pageNumber,
      size: pageSize,
      ...(query ? { q: query } : {})
    }
    try {
      const r = await api.get('/admin/catalog', { params })
      const data = r.data
      const items = Array.isArray(data.content) ? data.content : []
      setProducts(items)
      setTotalElements(typeof data.totalElements === 'number' ? data.totalElements : (Array.isArray(items) ? items.length : null))
      setTotalPages(typeof data.totalPages === 'number' ? data.totalPages : null)
    } catch (err) {
      setProducts([])
      setTotalElements(null)
      setTotalPages(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchUnits() {
    setIsUnitsLoading(true)
    try {
      try {
        const r = await api.get('/admin/units')
        const data = r.data
        setUnits(data)
        if (data && data.length && !createUnitTypeId) setCreateUnitTypeId(data[0].id)
      } catch (e) {
        setUnits([])
        return
      }
    } catch (e) {
      console.error('Failed to load units', e)
      setUnits([])
    } finally {
      setIsUnitsLoading(false)
    }
  }

  async function fetchCategories() {
    setIsCategoriesLoading(true)
    try {
      const r = await api.get('/admin/categories')
      const data = r.data
      // Normalize to array: handle paged (data.content) or array
      let arr: any[] = []
      if (Array.isArray(data)) {
        arr = data
      } else if (Array.isArray(data.content)) {
        arr = data.content
      }
      setCategories(arr)
      if (arr.length && !createCategoryId) setCreateCategoryId(arr[0].id)
    } catch (e) {
      console.error('Failed to load categories', e)
      setCategories([])
    } finally {
      setIsCategoriesLoading(false)
    }
  }

  async function createProduct(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setIsCreating(true)
      // create product via proxy-backed API

    const payload: any = {
      name: createName,
      description: createDesc,
      categoryId: createCategoryId,
      unitTypeId: createUnitTypeId,
      unitQuantityValue: typeof createUnitQuantityValue === 'number' ? createUnitQuantityValue : Number(createUnitQuantityValue) || 0,
      variants: createBarcode ? [{ barcode: createBarcode, actualWeightKg: 0, volumetricWeightKg: 0, images: createImageUrl ? [{ imageUrl: createImageUrl, displayOrder: 1, primaryImage: true, imageType: 'PRIMARY' }] : [], attributes: [], active: true }] : [],
      brand: createBrand,
      manufacturer: createManufacturer,
      originCountry: createOriginCountry,
      tags: createTagsText ? createTagsText.split(',').map((t) => t.trim()).filter(Boolean) : [],
      additionalInfo: createAdditionalInfo,
      active: createActive
    }

    const promise = api.post('/admin/catalog/products', payload).then((r) => r.data)

    try {
      const p = await toast.promise(promise, {
        loading: 'Creating product...',
        success: 'Product created',
        error: (err) => `Create failed: ${err?.message || err}`,
      })
      setCreateOpen(false)
      // clear form
      setCreateName('')
      setCreateDesc('')
      setCreateSku('')
      setCreateCategoryId(null)
      setCreateUnitTypeId(null)
      setCreateUnitQuantityValue('')
      setCreateBarcode('')
      setCreateImageUrl('')
      setCreateBrand('')
      setCreateManufacturer('')
      setCreateOriginCountry('')
      setCreateTagsText('')
      setCreateAdditionalInfo('')
      setCreateActive(true)

      // refresh
      setPageNumber(0)
      await fetchList()
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
      const promise = api.put('/admin/catalog', { id: editingId, name: editName, description: editDesc, sku: editSku, defaultUnitId: editDefaultUnitId }).then((r) => r.data)

    try {
      await toast.promise(promise, {
        loading: 'Saving product...',
        success: 'Product updated',
        error: (err) => `Update failed: ${err?.message || err}`,
      })
      // refresh current page
      await fetchList()
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
      const promise = api.delete('/admin/catalog', { data: { id } }).then(() => true)

    try {
      await toast.promise(promise, {
        loading: 'Deleting product...',
        success: 'Product deleted',
        error: (err) => `Delete failed: ${err?.message || err}`,
      })
      // refresh current page
      await fetchList()
    } catch (err) {
      // handled by toast
    } finally {
      setDeletingId(null)
    }
  }

  function renderPagination() {
    const pages = Math.max(1, totalPages ?? Math.max(1, Math.ceil((totalElements ?? 0) / pageSize)))
    return (
      <div className="flex items-center gap-2 mt-4">
        <button onClick={() => { setPageNumber((p) => Math.max(0, p - 1)); fetchList() }} disabled={pageNumber === 0} className="px-2 py-1 border rounded">Prev</button>
        <div>Page {pageNumber + 1} of {pages}</div>
        <button onClick={() => { setPageNumber((p) => Math.min(pages - 1, p + 1)); fetchList() }} disabled={pageNumber >= (pages - 1)} className="px-2 py-1 border rounded">Next</button>
        <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPageNumber(0); fetchList() }} className="border rounded px-2 py-1">
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    )
  }

  return (
    <div className="p-0">
      <Card>
        <CardHeader>
          <CardTitle>Central Catalog</CardTitle>
          <CardDescription>Central product catalog shared across shops</CardDescription>
        </CardHeader>
        <div className="p-4">



          <form onSubmit={(e) => { e.preventDefault(); setPageNumber(0); fetchList() }} className="mb-4 flex gap-2 items-center">
            <input placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} className="border rounded px-3 py-2 flex-1 min-w-[240px]" />
            <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPageNumber(0); fetchList() }} className="border rounded px-2 py-2">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
            <button type="button" onClick={() => { setQuery(''); setPageNumber(0); fetchList() }} className="px-3 py-2 border rounded">Clear</button>
            <Button onClick={() => setCreateOpen(true)} className="ml-2">Create product</Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p: any) => (
                <TableRow key={p.productId ?? p.id}>
                  <TableCell>
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded" /> : <div className="w-12 h-12 bg-gray-100 rounded" />}
                  </TableCell>
                  <TableCell>
                    <a href={`/admin/catalog/${p.productId ?? p.id}`} className="font-semibold hover:underline">{p.name}</a>
                    <div className="text-xs text-muted-foreground">ID: {p.productId ?? p.id}</div>
                  </TableCell>
                  <TableCell>
                    {p.sku}
                  </TableCell>
                  <TableCell>
                    {p.barcode}
                  </TableCell>
                  <TableCell>
                    {p.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button onClick={() => startEdit(p)} variant="outline">Edit</Button>
                      <Button onClick={() => deleteProduct(p.id || p.productId)} className="bg-red-600" disabled={deletingId === (p.id || p.productId)}>{deletingId === (p.id || p.productId) ? 'Deleting...' : 'Delete'}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Sheet open={createOpen} onOpenChange={(open) => setCreateOpen(open)}>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Create Product</SheetTitle>
                <SheetDescription>Provide product details (sample fields supported)</SheetDescription>
              </SheetHeader>

              <div className="p-4 space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input value={createName} onChange={(e) => setCreateName(e.target.value)} />
                </div>

                <div>
                  <Label>SKU</Label>
                  <Input value={createSku} onChange={(e) => setCreateSku(e.target.value)} />
                </div>

                <div>
                  <Label>Category</Label>
                  <select value={createCategoryId ?? ''} onChange={(e) => setCreateCategoryId(e.target.value || null)} className="border rounded px-3 py-2 w-full">
                    {isCategoriesLoading ? <option value="">Loading...</option> : categories.length === 0 ? <option value="">No categories</option> : (
                      <>
                        <option value="">No category</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <Label>Unit Type</Label>
                  <select value={createUnitTypeId ?? ''} onChange={(e) => setCreateUnitTypeId(e.target.value || null)} className="border rounded px-3 py-2 w-full">
                    {isUnitsLoading ? <option value="">Loading...</option> : units.length === 0 ? <option value="">No units</option> : (
                      <>
                        <option value="">No unit</option>
                        {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <Label>Unit Quantity</Label>
                  <Input type="number" value={String(createUnitQuantityValue)} onChange={(e) => setCreateUnitQuantityValue(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>

                <div>
                  <Label>Barcode</Label>
                  <Input value={createBarcode} onChange={(e) => setCreateBarcode(e.target.value)} />
                </div>

                <div>
                  <Label>Image URL</Label>
                  <Input value={createImageUrl} onChange={(e) => setCreateImageUrl(e.target.value)} />
                </div>

                <div>
                  <Label>Brand</Label>
                  <Input value={createBrand} onChange={(e) => setCreateBrand(e.target.value)} />
                </div>

                <div>
                  <Label>Manufacturer</Label>
                  <Input value={createManufacturer} onChange={(e) => setCreateManufacturer(e.target.value)} />
                </div>

                <div>
                  <Label>Origin Country</Label>
                  <Input value={createOriginCountry} onChange={(e) => setCreateOriginCountry(e.target.value)} />
                </div>

                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input value={createTagsText} onChange={(e) => setCreateTagsText(e.target.value)} />
                </div>

                <div>
                  <Label>Additional Info</Label>
                  <textarea value={createAdditionalInfo} onChange={(e) => setCreateAdditionalInfo(e.target.value)} className="border rounded p-2 w-full h-24" />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox checked={createActive} onCheckedChange={(v) => setCreateActive(Boolean(v))} />
                  <div className="text-sm">Active</div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={createProduct} disabled={isCreating}>{isCreating ? 'Creating...' : 'Create'}</Button>
                </div>
              </div>

              <SheetFooter />
            </SheetContent>
          </Sheet>

          {renderPagination()}
        </div>
        <CardFooter />
      </Card>
    </div>
  )
}
