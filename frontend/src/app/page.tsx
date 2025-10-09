import UidConverter from '@/components/UidConverter'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function Home() {
  return (
    <ProtectedRoute>
      <UidConverter />
    </ProtectedRoute>
  )
}
