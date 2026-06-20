import { Bible } from '../components/features/bible/Bible'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export default function BiblePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Bible />
      </AppShell>
    </ProtectedRoute>
  )
}