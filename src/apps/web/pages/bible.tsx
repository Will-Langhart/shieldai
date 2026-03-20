import { Bible } from '../components/features/bible/Bible'
import { Header } from '../components/Header'

export default function BiblePage() {
  return (
    <div className="min-h-screen bg-shield-canvas">
      <Header />
      <Bible />
    </div>
  )
}