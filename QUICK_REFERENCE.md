# Quick Reference - API Configuration

## TL;DR - For Developers

### Use This
```typescript
import { buildApiUrl } from '@/lib/api-config'

// Simple fetch
const res = await fetch(buildApiUrl('/api/v1/admin/users'))

// With parameters
const res = await fetch(
  buildApiUrl('/api/v1/admin/users', { page: 0, limit: 20 })
)

// POST request
const res = await fetch(buildApiUrl('/api/v1/admin/users'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

### Not This
```typescript
// ❌ Don't hardcode URLs
const res = await fetch('/api/v1/admin/users')
const res = await fetch(`http://localhost:8080/api/v1/admin/users`)
const res = await fetch(`https://api.yourdomain.com/api/v1/admin/users`)
```

## Environment Setup

### Development
```bash
# .env.local (NOT committed)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

**Ensure backend is running on port 8080!**

### Production
Set environment variable in deployment platform:
```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

## Common Patterns

### GET with Query Params
```typescript
import { buildApiUrl } from '@/lib/api-config'

const response = await fetch(
  buildApiUrl('/api/v1/admin/users', {
    page: 0,
    limit: 20,
    sort: 'name',
  })
)
```

### Conditional Parameters
```typescript
const response = await fetch(
  buildApiUrl('/api/v1/admin/users', {
    page: 0,
    limit: 20,
    ...(status && { status }), // Only add if status exists
  })
)
```

### POST with Error Handling
```typescript
try {
  const response = await fetch(buildApiUrl('/api/v1/admin/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(userData),
  })
  
  if (!response.ok) throw new Error('Failed')
  return await response.json()
} catch (error) {
  console.error('API Error:', error)
  throw error
}
```

### Dynamic Endpoints
```typescript
const userId = 'abc123'
const response = await fetch(buildApiUrl(`/api/v1/admin/users/${userId}`))
```

## Files to Know

| File | Purpose |
|------|---------|
| `lib/api-config.ts` | API configuration utilities |
| `.env.local` | Dev environment (localhost:8080) |
| `.env` | Default/prod environment values |
| `API_CONFIG.md` | Complete guide |
| `MIGRATION_EXAMPLE.md` | How to update pages |

## Debugging

### Check Current Base URL
```typescript
import { getApiBaseUrl } from '@/lib/api-config'
console.log('API Base:', getApiBaseUrl())
// Dev: http://localhost:8080
// Prod: https://api.yourdomain.com
```

### Check Full URL
```typescript
import { buildApiUrl } from '@/lib/api-config'
console.log(buildApiUrl('/api/v1/admin/users', { page: 0 }))
// Dev: http://localhost:8080/api/v1/admin/users?page=0
// Prod: https://api.yourdomain.com/api/v1/admin/users?page=0
```

## Troubleshooting

### API calls returning 404?
- Ensure backend is running on correct port
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Verify endpoint path is correct

### Wrong API URL being used?
- Check environment variables: `NEXT_PUBLIC_API_BASE_URL`
- Development: Should be `http://localhost:8080`
- Production: Should be your API domain

### Network errors?
- Verify backend is running and accessible
- Check browser console for full error message
- Verify CORS is enabled on backend (if needed)

## Pages Using This System

✅ Migrated:
- Business Categories

⏳ Ready to Migrate:
- Users
- Customers
- Orders
- Shops
- Catalog
- Categories
- Units
- Unit Types
- Unit Classes

## Need Help?

1. **Configuration Questions**: See `API_CONFIG.md`
2. **Migration Questions**: See `MIGRATION_EXAMPLE.md`
3. **Full Details**: See `API_SETUP_SUMMARY.md`
4. **Verification**: See `API_SETUP_VERIFICATION.md`

---

**Keep it simple: `buildApiUrl(endpoint, params)`**
