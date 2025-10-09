import { ref, type Ref } from 'vue'

export interface UseApiState<T, TArgs extends unknown[] = unknown[]> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: (...args: TArgs) => Promise<{ success: boolean; error?: string }>
  reset: () => void
}

export function useApi<T, TArgs extends unknown[] = unknown[]>(
  apiFunction: (...args: TArgs) => Promise<{ data: T; success: boolean; error?: string }>
): UseApiState<T, TArgs> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)

  const execute = async (...args: TArgs) => {
    loading.value = true
    error.value = null

    try {
      const result = await apiFunction(...args)

      if (result.success) {
        data.value = result.data
        return { success: true }
      } else {
        error.value = result.error || 'Operation failed'
        return { success: false, error: error.value || undefined }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    data.value = null
    error.value = null
    loading.value = false
  }

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}
