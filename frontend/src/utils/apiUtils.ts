// Utility functions for API calls with automatic 401 handling

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  status?: number
}

export async function apiCall<T = unknown>(
  url: string,
  options: RequestInit = {},
  onUnauthorized?: () => void
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('token')
      if (onUnauthorized) {
        onUnauthorized()
      }
      return {
        success: false,
        error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        status: 401
      }
    }

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        data,
        status: response.status
      }
    } else {
      // Handle other error responses
      let errorMsg = 'Có lỗi xảy ra khi gọi API'
      try {
        const errorData = await response.json()
        errorMsg = errorData.message || errorMsg
      } catch {
        // Handle specific HTTP status codes
        if (response.status === 413) {
          errorMsg = 'Dữ liệu quá lớn. Vui lòng giảm số lượng UID hoặc chia thành nhiều lần gửi.'
        } else {
          errorMsg = `API Error: ${response.status} ${response.statusText}`
        }
      }

      return {
        success: false,
        error: errorMsg,
        status: response.status
      }
    }
  } catch (error) {
    console.error('API call error:', error)
    return {
      success: false,
      error: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.',
      status: 0
    }
  }
}