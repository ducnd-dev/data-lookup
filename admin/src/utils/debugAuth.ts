// Debug utility to check auth state
export const debugAuth = () => {
  const token = localStorage.getItem('accessToken')
  const user = localStorage.getItem('user')
  
  console.log('=== AUTH DEBUG ===')
  console.log('Token exists:', !!token)
  console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'null')
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      console.log('Token payload:', payload)
      console.log('Token expires at:', new Date(payload.exp * 1000).toLocaleString())
      console.log('Token expired:', payload.exp < Math.floor(Date.now() / 1000))
    } catch (e) {
      console.log('Token parse error:', e)
    }
  }
  
  console.log('User data exists:', !!user)
  if (user) {
    try {
      const userData = JSON.parse(user)
      console.log('User data:', userData)
    } catch (e) {
      console.log('User data parse error:', e)
    }
  }
  console.log('==================')
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth
}