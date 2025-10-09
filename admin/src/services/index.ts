// Main API exports
export { default as api, apiCall } from './api'
export * from './authApi'
export { fileApi } from './fileApi'
export * from './lookupApi'
export * from './userApi'
export * from './roleApi'
export * from './dashboardApi'
export * from './jobApi'

// Re-export commonly used types
export type {
    AuthResponse, LoginCredentials,
    RegisterData
} from './authApi'

export type {
    AdvancedBulkSearchRequest, BulkSearchRequest, CreateReportRequest, JobStatus, LookupResult, QueryLookupRequest
} from './lookupApi'

export type {
    FileInfo, UploadChunkRequest
} from './fileApi'

export type {
    User, CreateUserRequest, UpdateUserRequest, AssignRoleRequest
} from './userApi'

export type {
    Role, Permission, CreateRoleRequest, UpdateRoleRequest, AssignPermissionRequest
} from './roleApi'

export type {
    DashboardStats, ChartData, ActivityLog
} from './dashboardApi'

export type {
    Job, CreateJobDto, UpdateJobDto, JobQuery
} from './jobApi'
