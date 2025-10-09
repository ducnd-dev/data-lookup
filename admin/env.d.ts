/// <reference types="vite/client" />

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    requiresRoles?: string[]
    requiresPermissions?: string[]
  }
}
