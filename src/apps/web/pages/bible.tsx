import { Bible } from '../components/features/bible/Bible'
import { Header } from '../components/Header'

export default function BiblePage() {
  return (
    <div className="min-h-screen bg-[#1A1D24]">
      <Header />
      <Bible />
    </div>
  )
}