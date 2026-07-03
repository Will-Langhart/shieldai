import { Bible } from '../components/features/bible/Bible'
import { Header } from '../components/Header'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export default function BiblePage() {
  return (
    <ProtectedRoute>
      <div className="shield-page-bg">
        <Header showNav />
        <Bible />
      </div>
    </ProtectedRoute>
  )
}
