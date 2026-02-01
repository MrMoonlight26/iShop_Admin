# API Configuration Guide

## Overview

This application uses a centralized API configuration system to manage different base URLs for development and production environments.

## Environment Variables

### `NEXT_PUBLIC_API_BASE_URL`

This is the main environment variable that controls the API base URL used throughout the application.

**Important:** This variable must be prefixed with `NEXT_PUBLIC_` to be accessible on the client-side.

### Development Setup (`.env.local`)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

This file is used for local development and should **NOT be committed** to version control.

### Production Setup (`.env`)

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

Override this in your production environment with the actual API domain.

## Usage in Components

### Using `buildApiUrl()` - Recommended

```typescript
import { buildApiUrl } from '@/lib/api-config'

// Basic URL building
const url = buildApiUrl('/api/v1/admin/business-categories')
// Result: http://localhost:8080/api/v1/admin/business-categories

// With query parameters
const url = buildApiUrl('/api/v1/admin/business-categories', {
  page: 0,
  size: 20,
  sort: 'name',
})
// Result: http://localhost:8080/api/v1/admin/business-categories?page=0&size=20&sort=name

// In fetch calls
const response = await fetch(buildApiUrl('/api/v1/admin/business-categories'), {
  credentials: 'same-origin',
})
```

### Using `getApiBaseUrl()`

```typescript
import { getApiBaseUrl } from '@/lib/api-config'

const baseUrl = getApiBaseUrl()
// Returns: http://localhost:8080 (or production URL)
```

### Using `apiFetch()` - Helper Function

```typescript
import { apiFetch } from '@/lib/api-config'

const response = await apiFetch('/api/v1/admin/business-categories', {
  params: { page: 0, size: 20 },
})
```

## Environment-Specific Configuration

### Local Development
- `.env.local` is read and **NOT committed** to git
- Override `NEXT_PUBLIC_API_BASE_URL` to point to your local backend
- Default: `http://localhost:8080`

### Staging/Production
- Use GitHub Secrets or your deployment platform's environment variables
- Set `NEXT_PUBLIC_API_BASE_URL` to your production API domain
- Example: `https://api.yourdomain.com`

## Migration Guide

### Old Approach
```typescript
const response = await fetch('/api/v1/admin/users', {
  credentials: 'same-origin',
})
```

### New Approach
```typescript
import { buildApiUrl } from '@/lib/api-config'

const response = await fetch(buildApiUrl('/api/v1/admin/users'), {
  credentials: 'same-origin',
})
```

## Benefits

1. **Single Source of Truth**: All API URLs are configured in one place
2. **Environment Management**: Easy switching between dev/staging/prod without code changes
3. **Type-Safe**: Built-in TypeScript support
4. **Query Parameters**: Automatic URL encoding and parameter handling
5. **Scalable**: Easy to add authentication headers, logging, etc. in the future

## Example: Complete API Call

```typescript
import { buildApiUrl } from '@/lib/api-config'

async function fetchUsers(page: number, size: number) {
  try {
    const response = await fetch(
      buildApiUrl('/api/v1/admin/users', { page, size }),
      { credentials: 'same-origin' }
    )
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch users:', error)
    throw error
  }
}
```

## Future Enhancements

You can extend `lib/api-config.ts` with:
- Request interceptors
- Authentication header injection
- Request/response logging
- Error handling middleware
- Request retries with exponential backoff
