"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner, ErrorAlert } from '@/components/ui/loading-error'
import { formatErrorMessage } from '@/lib/api-helpers'
import { buildApiUrl } from '@/lib/api-config'
import { signinPath } from '@/lib/appPaths'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BusinessCategory {
  id: string
  name: string
  code: string
  active: boolean
  businessRules?: Record<string, any>
}

interface FormData {
  name: string
  code: string
  active: boolean
}

export default function BusinessCategoriesPage() {
  const [categories, setCategories] = useState<BusinessCategory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    active: true,
  })

  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push(signinPath())
    if (status === 'authenticated' && (session as any)?.user?.role !== 'ADMIN') router.push('/')
  }, [status, session, router])

  if (status === 'loading') return null

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [sortBy, setSortBy] = useState('name')
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchList()
  }, [page, size, sortBy, query])

  async function fetchList() {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        buildApiUrl('/api/v1/admin/business-categories', {
          page,
          size,
          sort: sortBy,
          ...(query && { q: query }),
        }),
        { credentials: 'same-origin' }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to load business categories: ${response.status}`)
      }
      
      const data = await response.json()
      setCategories(Array.isArray(data) ? data : data.data || data.content || [])
      setTotal(data.total || data.length || 0)
    } catch (err) {
      setError(formatErrorMessage(err))
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setError(null)
      const method = editingId ? 'PUT' : 'POST'
      const endpoint = editingId 
        ? `/api/v1/admin/business-categories/${editingId}`
        : '/api/v1/admin/business-categories'

      const response = await fetch(buildApiUrl(endpoint), {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingId ? 'update' : 'create'} category`)
      }

      const result = await response.json()
      
      if (editingId) {
        setCategories((prev) =>
          prev.map((cat) => (cat.id === editingId ? result : cat))
        )
      } else {
        setCategories((prev) => [result, ...prev])
      }

      setShowForm(false)
      setEditingId(null)
      setFormData({ name: '', code: '', active: true })
      setPage(0)
      fetchList()
    } catch (err) {
      setError(formatErrorMessage(err))
    }
  }

  async function handleEdit(category: BusinessCategory) {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      code: category.code,
      active: category.active,
    })
    setShowForm(true)
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this category?`)) {
      return
    }

    try {
      setUpdatingId(id)
      setError(null)
      
      const response = await fetch(buildApiUrl(`/api/v1/admin/business-categories/${id}/toggle-status`), {
        method: 'PATCH',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle status')
      }

      const result = await response.json()
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? result : cat))
      )
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
        <div className="text-sm text-muted-foreground">
          Total: {total}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            size="sm"
          >
            Prev
          </Button>
          <div className="text-sm min-w-max">
            Page {page + 1} of {pages}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page >= pages - 1}
            size="sm"
          >
            Next
          </Button>
          <select
            value={size}
            onChange={(e) => {
              setSize(parseInt(e.target.value, 10))
              setPage(0)
            }}
            className="border rounded px-2 py-1 text-sm bg-background"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Categories</h1>
          <p className="text-muted-foreground mt-1">Manage your business categories and their configurations</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setFormData({ name: '', code: '', active: true })
            setShowForm(!showForm)
          }}
          size="lg"
        >
          {showForm ? 'Cancel' : '+ New Category'}
        </Button>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchList} />}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Category' : 'Create New Category'}
            </CardTitle>
            <CardDescription>
              {editingId ? 'Update the category details' : 'Add a new business category to the system'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Electronics"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., ELEC"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked as boolean })
                  }
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({ name: '', code: '', active: true })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setPage(0)
            fetchList()
          }}
          className="flex gap-2 flex-1"
        >
          <Input
            placeholder="Search by name or code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner text="Loading business categories..." />
        </div>
      ) : (
        <>
          {categories.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg">No business categories found</p>
                  <p className="text-sm">Create one to get started</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.code}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.active ? 'default' : 'secondary'}>
                          {category.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={category.active ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() =>
                              toggleStatus(category.id, category.active)
                            }
                            disabled={updatingId === category.id}
                          >
                            {updatingId === category.id
                              ? '...'
                              : category.active
                              ? 'Deactivate'
                              : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {categories.length > 0 && renderPagination()}
        </>
      )}
    </div>
  )
}
