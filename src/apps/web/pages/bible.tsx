import { Bible } from '../components/features/bible/Bible'
import { Header } from '../components/Header'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export default function BiblePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-shield-canvas">
        <Header showNav />
        <Bible />
      </div>
    </ProtectedRoute>
  )
}
