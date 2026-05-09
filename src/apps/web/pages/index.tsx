import { Home } from './Home'
import { Header } from '../components/Header'
import Footer from '../components/layout/Footer'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export default function IndexPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen relative">
        <Header />
        <Home />
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
