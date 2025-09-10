import { ChurchFinder } from '../pages/ChurchFinder'
import { Header } from '../components/Header'

export default function ChurchesPage() {
  return (
    <div className="min-h-screen bg-[#1A1D24]">
      <Header />
      <ChurchFinder />
    </div>
  )
}
