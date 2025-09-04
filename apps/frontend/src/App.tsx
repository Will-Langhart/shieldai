import { Routes, Route, useLocation } from 'react-router-dom'
import { ErrorBoundary } from './components/common'
import { AuthProvider, ThemeProvider } from './contexts'
import { Header, Footer } from './components/layout'
import { Home } from './pages/Home'
import { Bible } from './pages/Bible'
import { Chat } from './pages/Chat'
import { ChurchFinder } from './pages/ChurchFinder'

function AppContent() {
  const location = useLocation()
  const isChatPage = location.pathname === '/chat'

  if (isChatPage) {
    return (
      <Routes>
        <Route path="/chat" element={<Chat />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1A1D24]">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bible" element={<Bible />} />
          <Route path="/churches" element={<ChurchFinder />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App