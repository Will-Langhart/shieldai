import { Home } from '../pages/Home'
import { Header } from '../components/Header'
import Footer from '../components/layout/Footer'

export default function IndexPage() {
  return (
    <div className="min-h-screen relative">
      <Header />
      <Home />
      <Footer />
    </div>
  )
}
