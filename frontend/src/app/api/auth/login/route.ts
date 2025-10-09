import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3000/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Gọi API backend để đăng nhập
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        token: data.access_token,
        user: {
          id: data.user.id,
          name: data.user.fullName,
          email: data.user.email,
          roles: data.user.roles,
          permissions: data.user.permissions
        },
      })
    } else {
      return NextResponse.json(
        { success: false, message: data.message || 'Email hoặc mật khẩu không chính xác' },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra trong quá trình đăng nhập' },
      { status: 500 }
    )
  }
}