import { Bible } from '../components/features/bible/Bible'
import { Header } from '../components/Header'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { Seo } from '../components/Seo'
import { useWarmTheme } from '../hooks/useWarmTheme'

export default function BiblePage() {
  const { themeAttr } = useWarmTheme()
  return (
    <>
      <Seo
        title="Bible Study & Reading"
        description="Read and study Scripture with Shield AI — passages, search, cross-references, study questions, and AI-generated insights to deepen your understanding of the Bible."
        path="/bible"
      />
      <div className="warm-theme" {...themeAttr}>
      <ProtectedRoute>
        <div className="shield-page-bg">
          <Header showNav />
          <Bible />
        </div>
      </ProtectedRoute>
      </div>
    </>
  )
}
