import { Link } from 'react-router-dom'
import { Shield, BookOpen, MessageCircle, MapPin, ArrowRight } from 'lucide-react'

export function Home() {
  return (
    <div className="min-h-screen bg-[#1A1D24]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1A1D24] to-[#2C303A] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-[#E0E0E0] mb-6">
              Welcome to{' '}
              <span className="text-blue-400">Shield AI</span>
            </h1>
            <p className="text-xl text-[#9CA3AF] mb-8 max-w-3xl mx-auto">
              Your Christian AI assistant with Bible integration, church finder, and scripture-based guidance.
              Experience the power of AI enhanced with God's Word.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/chat"
                className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center space-x-2 text-lg px-8 py-3 rounded-lg transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Start Chatting</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/bible"
                className="bg-[#2C303A] hover:bg-[#3A404B] text-[#E0E0E0] border border-[#3A404B] inline-flex items-center space-x-2 text-lg px-8 py-3 rounded-lg transition-colors"
              >
                <BookOpen className="h-5 w-5" />
                <span>Explore Bible</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#1A1D24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#E0E0E0] mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-[#9CA3AF] max-w-2xl mx-auto">
              Discover how Shield AI can enhance your spiritual journey with cutting-edge technology.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[#2C303A] border border-[#3A404B] rounded-lg p-6 text-center hover:bg-[#3A404B] transition-colors">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#E0E0E0] mb-2">Bible Study</h3>
              <p className="text-[#9CA3AF]">
                Search and study scripture with AI-powered insights and cross-references.
              </p>
            </div>
            
            <div className="bg-[#2C303A] border border-[#3A404B] rounded-lg p-6 text-center hover:bg-[#3A404B] transition-colors">
              <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#E0E0E0] mb-2">AI Chat</h3>
              <p className="text-[#9CA3AF]">
                Get biblical guidance and answers to your spiritual questions.
              </p>
            </div>
            
            <div className="bg-[#2C303A] border border-[#3A404B] rounded-lg p-6 text-center hover:bg-[#3A404B] transition-colors">
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#E0E0E0] mb-2">Church Finder</h3>
              <p className="text-[#9CA3AF]">
                Discover local churches and Christian communities near you.
              </p>
            </div>
            
            <div className="bg-[#2C303A] border border-[#3A404B] rounded-lg p-6 text-center hover:bg-[#3A404B] transition-colors">
              <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#E0E0E0] mb-2">Scripture Integration</h3>
              <p className="text-[#9CA3AF]">
                Every response is grounded in biblical truth and wisdom.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scripture Section */}
      <section className="py-20 bg-[#2C303A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-[#E0E0E0] mb-8">
            Scripture of the Day
          </h2>
          <blockquote className="text-2xl text-[#9CA3AF] font-serif italic mb-6">
            "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future."
          </blockquote>
          <cite className="text-lg text-blue-400 font-medium">Jeremiah 29:11</cite>
        </div>
      </section>
    </div>
  )
}