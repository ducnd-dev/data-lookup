# Frontend API Integration

This document explains how to use the API integration layer that connects the frontend to the backend services.

## Overview

The API integration includes:
- Base axios configuration with interceptors
- Modular API services for different endpoints
- Vuex/Pinia store integration
- Composables for common API patterns
- TypeScript interfaces for type safety

## Structure

```
src/
├── services/
│   ├── api.ts              # Base axios configuration
│   ├── authApi.ts          # Authentication endpoints
│   ├── lookupApi.ts        # Data lookup endpoints
│   ├── fileApi.ts          # File upload endpoints
│   └── index.ts            # Main exports
├── stores/
│   └── auth.ts             # Authentication store (Pinia)
├── composables/
│   └── useApi.ts           # Reusable API composable
└── components/
    ├── LoginForm.vue       # Example login component
    └── LookupSearch.vue    # Example lookup component
```

## Configuration

### Environment Variables

Create `.env.development` and `.env.production` files:

```env
# .env.development
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Data Lookup Application
VITE_APP_VERSION=1.0.0
```

```env
# .env.production
VITE_API_URL=https://your-production-api.com
VITE_APP_NAME=Data Lookup Application
VITE_APP_VERSION=1.0.0
```

### Base API Configuration

The base API configuration in `services/api.ts` includes:
- Automatic token management
- Request/response interceptors
- Error handling
- Token refresh logic (ready to implement)

## Usage Examples

### 1. Authentication

```typescript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Login
const result = await authStore.login({
  email: 'user@example.com',
  password: 'password123'
})

if (result.success) {
  console.log('Logged in successfully')
  // Redirect to dashboard
} else {
  console.error('Login failed:', result.error)
}

// Register
await authStore.register({
  email: 'newuser@example.com',
  password: 'password123',
  fullName: 'New User'
})

// Logout
authStore.logout()

// Check authentication status
if (authStore.isAuthenticated) {
  console.log('User is logged in:', authStore.user)
}
```

### 2. Data Lookup

```typescript
import { useApi } from '@/composables/useApi'
import { lookupApi } from '@/services'

// Using the composable
const { data, loading, error, execute } = useApi(lookupApi.queryLookup)

// Execute search
await execute({
  colName: 'uid',
  values: ['USR001', 'USR002'],
  page: 1,
  limit: 10
})

// Access results
if (data.value) {
  console.log('Total results:', data.value.total)
  console.log('Data:', data.value.data)
}
```

### 3. File Upload

```typescript
import { fileApi } from '@/services'

// Upload file in chunks
const file = document.querySelector('input[type="file"]').files[0]

try {
  const result = await fileApi.uploadFileInChunks(
    file,
    1024 * 1024, // 1MB chunks
    (progress) => {
      console.log(`Upload progress: ${progress}%`)
    }
  )
  
  if (result.success) {
    console.log('File uploaded successfully')
  }
} catch (error) {
  console.error('Upload failed:', error)
}
```

### 4. Job Management

```typescript
import { lookupApi } from '@/services'

// Create a report job
const reportResult = await lookupApi.createReport({
  colName: 'phone',
  values: ['+1234567890']
})

if (reportResult.success) {
  const jobId = reportResult.data.jobId
  
  // Check job status
  const statusResult = await lookupApi.getJobStatus(jobId)
  if (statusResult.success) {
    console.log('Job status:', statusResult.data.status)
  }
}

// List all jobs
const jobsResult = await lookupApi.listJobs(1, 10)
if (jobsResult.success) {
  console.log('User jobs:', jobsResult.data.data)
}
```

## API Services

### Authentication API (`authApi`)

- `login(credentials)` - User login
- `register(data)` - User registration
- `logout()` - User logout
- `getCurrentUser()` - Get current user from storage
- `isAuthenticated()` - Check authentication status

### Lookup API (`lookupApi`)

- `queryLookup(request)` - Query lookup data
- `getLookupById(id)` - Get specific lookup record
- `createReport(request)` - Create lookup report job
- `getJobStatus(jobId)` - Get job status
- `listJobs(page, limit)` - List user jobs
- `exportLookupData(request)` - Export lookup data
- `bulkSearch(request)` - Bulk search functionality
- `advancedBulkSearch(request)` - Advanced bulk search
- `bulkSearchExport(request)` - Export bulk search results

### File API (`fileApi`)

- `uploadChunk(request)` - Upload file chunk
- `listFiles(page, limit)` - List uploaded files
- `uploadFileInChunks(file, chunkSize, onProgress)` - Helper for chunked upload

## Error Handling

### Global Error Handling

The base API configuration automatically handles:
- 401 Unauthorized responses (redirects to login)
- Network errors
- Request timeouts

### Component-level Error Handling

```typescript
import { useApi } from '@/composables/useApi'
import { lookupApi } from '@/services'

const { data, loading, error, execute } = useApi(lookupApi.queryLookup)

// Execute API call
const result = await execute(requestData)

if (!result.success) {
  // Handle error
  console.error('API call failed:', result.error)
  // Show user-friendly error message
}

// Or check the error ref
if (error.value) {
  console.error('Error:', error.value)
}
```

## TypeScript Support

All API services include full TypeScript support with:
- Request/response type definitions
- Interface exports for component usage
- Generic type support for API responses

```typescript
import type { 
  LoginCredentials, 
  QueryLookupRequest, 
  PaginatedResponse,
  LookupResult 
} from '@/services'

// Type-safe request data
const request: QueryLookupRequest = {
  colName: 'address',
  values: ['123 Main St'],
  page: 1,
  limit: 10
}

// Type-safe response handling
const { data } = useApi<PaginatedResponse<LookupResult>>(lookupApi.queryLookup)
```

## Best Practices

### 1. Use Composables for Reactive State

```typescript
// ✅ Good - using composable
const { data, loading, error, execute } = useApi(lookupApi.queryLookup)

// ❌ Avoid - direct API calls without state management
const response = await lookupApi.queryLookup(request)
```

### 2. Handle Loading States

```vue
<template>
  <div>
    <button :disabled="loading" @click="search">
      {{ loading ? 'Searching...' : 'Search' }}
    </button>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-if="data">
      <!-- Results -->
    </div>
  </div>
</template>
```

### 3. Implement Proper Error Boundaries

```typescript
// Component-level error handling
const handleSearch = async () => {
  try {
    const result = await execute(searchParams)
    if (!result.success) {
      // Show user-friendly error
      showErrorMessage(result.error)
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error:', error)
    showErrorMessage('An unexpected error occurred')
  }
}
```

### 4. Use Type Guards

```typescript
const isValidResponse = (data: unknown): data is PaginatedResponse<LookupResult> => {
  return data !== null && typeof data === 'object' && 'data' in data
}

if (isValidResponse(apiResponse)) {
  // Safe to use apiResponse.data
}
```

## Authentication Flow

1. User logs in via `authStore.login()`
2. Access token is stored in localStorage
3. Axios interceptor automatically adds token to requests
4. On 401 responses, token refresh can be attempted
5. On authentication failure, user is redirected to login

## Development Setup

1. Install dependencies: `npm install`
2. Set up environment variables
3. Start development server: `npm run dev`
4. Start backend server on port 3000

## Production Considerations

1. Use environment-specific API URLs
2. Implement proper error logging
3. Add request/response compression
4. Implement retry logic for failed requests
5. Add request deduplication for identical requests
6. Consider implementing offline support with service workers