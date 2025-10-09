import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3000/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Gọi API backend để đăng ký
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        fullName: name, // Backend sử dụng fullName thay vì name
        email, 
        password
        // Note: Backend chưa hỗ trợ phone field trong register
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Đăng ký thành công',
        user: {
          id: data.id,
          name: data.fullName,
          email: data.email
        },
      })
    } else {
      return NextResponse.json(
        { success: false, message: data.message || 'Đăng ký thất bại' },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra trong quá trình đăng ký' },
      { status: 500 }
    )
  }
}