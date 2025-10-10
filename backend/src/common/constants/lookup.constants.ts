/**
 * Lookup data column mappings and constants
 */

export const LOOKUP_COLUMN_MAP = {
  'uid': 'uid',
  'phone': 'phone',
  'name': 'name',
  'address': 'address',
} as const;

export type LookupColumnKey = keyof typeof LOOKUP_COLUMN_MAP;
export type LookupColumnValue = typeof LOOKUP_COLUMN_MAP[LookupColumnKey];

/**
 * Available lookup columns for querying
 */
export const AVAILABLE_LOOKUP_COLUMNS = Object.keys(LOOKUP_COLUMN_MAP) as LookupColumnKey[];

/**
 * Database column names
 */
export const DATABASE_COLUMNS = Object.values(LOOKUP_COLUMN_MAP) as LookupColumnValue[];

/**
 * Column display names (for UI/reports)
 */
export const COLUMN_DISPLAY_NAMES = {
  'uid': 'User ID',
  'phone': 'Phone Number',
  'name': 'Name',
  'address': 'Address',
} as const;

/**
 * Column validation rules
 */
export const COLUMN_VALIDATION = {
  uid: {
    maxLength: 255,
    required: true,
    pattern: /^[A-Z0-9]+$/i, // Alphanumeric only
  },
  phone: {
    maxLength: 20,
    required: false,
    pattern: /^[\+]?[0-9\-\(\)\s]+$/, // Phone number format
  },
  name: {
    maxLength: 255,
    required: false,
    pattern: /^.+$/, // Any characters
  },
  address: {
    maxLength: 500,
    required: false,
    pattern: /^.+$/, // Any characters
  },
} as const;

/**
 * File upload constants
 */
export const FILE_UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  allowedExtensions: ['.csv', '.xls', '.xlsx'],
  batchSize: 1000,
} as const;

/**
 * Job processing constants
 */
export const JOB_CONFIG = {
  defaultPriority: 5,
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  timeouts: {
    import: 300000, // 5 minutes
    export: 600000, // 10 minutes
    report: 900000, // 15 minutes
  },
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 100,
  maxLimit: 1000,
} as const;