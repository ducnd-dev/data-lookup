import { NextRequest, NextResponse } from 'next/server'

interface BackendLookupResult {
  id: string
  uid: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3000/api'

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization) {
      return NextResponse.json(
        { success: false, message: 'Token không được cung cấp' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { uids } = body

    if (!uids || !Array.isArray(uids) || uids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Danh sách UID không hợp lệ' },
        { status: 400 }
      )
    }

    // Gọi API backend để lookup UID thông qua query endpoint
    const response = await fetch(`${BACKEND_URL}/lookup/query`, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        colName: 'uid', // Tìm theo UID
        values: uids,
        searchMode: 'exact',
        page: 1,
        limit: 1000
      }),
    })

    const data = await response.json()

    if (response.ok) {
      // Chuyển đổi format response từ backend sang format mong muốn
      const results = uids.map(uid => {
        const found = data.data?.find((item: BackendLookupResult) => item.uid === uid)
        return {
          uid: uid,
          phone: found?.phone || null,
          address: found?.address || null,
          found: !!found
        }
      })

      return NextResponse.json({
        success: true,
        results: results
      })
    } else {
      return NextResponse.json(
        { success: false, message: data.message || 'Không thể thực hiện lookup' },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Lookup error:', error)
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra trong quá trình lookup' },
      { status: 500 }
    )
  }
}