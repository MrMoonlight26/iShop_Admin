/**
 * MIGRATION EXAMPLE: How to update other pages to use the API config
 * 
 * This file shows the before/after pattern for updating pages to use
 * the centralized API configuration system (lib/api-config.ts)
 */

// ============================================================================
// EXAMPLE 1: Simple GET request with query parameters
// ============================================================================

// BEFORE:
async function fetchUsersBefore() {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (query) params.set('q', query)
  
  const response = await fetch(`/api/v1/admin/users?${params.toString()}`, {
    credentials: 'same-origin',
  })
}

// AFTER:
import { buildApiUrl } from '@/lib/api-config'

async function fetchUsersAfter() {
  const response = await fetch(
    buildApiUrl('/api/v1/admin/users', {
      page,
      limit,
      ...(query && { q: query }),
    }),
    { credentials: 'same-origin' }
  )
}

// ============================================================================
// EXAMPLE 2: POST request with body
// ============================================================================

// BEFORE:
async function createUserBefore() {
  const response = await fetch('/api/v1/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(userData),
  })
}

// AFTER:
async function createUserAfter() {
  const response = await fetch(buildApiUrl('/api/v1/admin/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(userData),
  })
}

// ============================================================================
// EXAMPLE 3: PUT/PATCH request with dynamic endpoint
// ============================================================================

// BEFORE:
async function updateUserBefore(userId: string) {
  const response = await fetch(`/api/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(updatedData),
  })
}

// AFTER:
async function updateUserAfter(userId: string) {
  const response = await fetch(buildApiUrl(`/api/v1/admin/users/${userId}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(updatedData),
  })
}

// ============================================================================
// EXAMPLE 4: Complex query parameters
// ============================================================================

// BEFORE:
async function fetchFilteredDataBefore() {
  const params = new URLSearchParams()
  params.set('page', String(pageNumber))
  params.set('size', String(pageSize))
  params.set('sort', sortBy)
  if (statusFilter) params.set('status', statusFilter)
  if (ownerTypeFilter) params.set('ownerType', ownerTypeFilter)
  
  const url = `/api/v1/admin/shops?${params.toString()}`
  const response = await fetch(url, { credentials: 'same-origin' })
}

// AFTER:
async function fetchFilteredDataAfter() {
  const response = await fetch(
    buildApiUrl('/api/v1/admin/shops', {
      page: pageNumber,
      size: pageSize,
      sort: sortBy,
      ...(statusFilter && { status: statusFilter }),
      ...(ownerTypeFilter && { ownerType: ownerTypeFilter }),
    }),
    { credentials: 'same-origin' }
  )
}

// ============================================================================
// PAGES TO UPDATE (Priority Order)
// ============================================================================

/*
Priority 1 - Core Admin Pages:
  ✅ app/admin/business-categories/page.tsx (DONE)
  [ ] app/admin/users/page.tsx
  [ ] app/admin/customers/page.tsx
  [ ] app/admin/orders/page.tsx
  [ ] app/admin/shops/page.tsx

Priority 2 - Catalog & Units:
  [ ] app/admin/catalog/page.tsx
  [ ] app/admin/categories/page.tsx
  [ ] app/admin/units/page.tsx
  [ ] app/admin/units/types/page.tsx
  [ ] app/admin/units/classes/page.tsx

Priority 3 - API Routes (for server-side):
  [ ] app/api/admin/* (if needed for server-side API calls)
*/

// ============================================================================
// CHECKLIST FOR MIGRATION
// ============================================================================

/*
1. [ ] Add import at the top:
   import { buildApiUrl } from '@/lib/api-config'

2. [ ] Replace all fetch() calls:
   - Find: `/api/v1/admin/...`
   - Replace with: buildApiUrl('/api/v1/admin/...')

3. [ ] Replace URLSearchParams:
   - Find: new URLSearchParams() logic
   - Replace with: buildApiUrl(endpoint, { params })

4. [ ] Test locally:
   - Run: npm run dev
   - Verify API calls work with http://localhost:8080

5. [ ] Test with environment variable:
   - Update .env.local with NEXT_PUBLIC_API_BASE_URL
   - Verify it works

6. [ ] Commit changes
*/

export default {}
