'use client'

import { useRouter } from 'next/navigation'
import ChangePasswordForm from '@/components/ChangePasswordForm'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ChangePasswordPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // Redirect back after successful password change
    setTimeout(() => {
      router.back()
    }, 1000)
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        </div>

        {/* Change Password Form */}
        <ChangePasswordForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}