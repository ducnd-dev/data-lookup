import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3000/api'

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization) {
      return NextResponse.json(
        { success: false, message: 'Token không được cung cấp' },
        { status: 401 }
      )
    }

    // Gọi API backend để lấy thông tin user
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          name: data.user.fullName,
          email: data.user.email,
          roles: data.user.roles
        },
      })
    } else {
      return NextResponse.json(
        { success: false, message: data.message || 'Không thể lấy thông tin người dùng' },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra khi lấy thông tin người dùng' },
      { status: 500 }
    )
  }
}