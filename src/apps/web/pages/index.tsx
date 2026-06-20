import { Home } from './Home'
import { AppShell } from '../components/layout/AppShell'
import Footer from '../components/layout/Footer'

export default function IndexPage() {
  return (
    <AppShell>
      <Home />
      <Footer />
    </AppShell>
  )
}
