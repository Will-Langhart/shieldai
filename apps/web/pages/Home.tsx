import Link from 'next/link'
import { BookOpen, MessageCircle, MapPin, ArrowRight, Star, CheckCircle, Quote, Play, Sparkles, Heart, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

// Question Rotator Component
function QuestionRotator() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const questions = [
    "How can I defend the existence of God scientifically?",
    "What evidence supports the resurrection of Jesus?",
    "How do I respond to the problem of evil and suffering?",
    "Is the Bible historically reliable and accurate?",
    "How can I explain the Trinity to non-Christians?",
    "What's the difference between faith and blind belief?",
    "How do I address questions about evolution and creation?",
    "What are the strongest arguments for Christianity?",
    "How can I defend the moral argument for God?",
    "What about other religions - why Christianity?",
    "How do I respond to 'God of the gaps' criticisms?",
    "What evidence exists for the reliability of the Gospels?",
    "How can I explain free will and God's sovereignty?",
    "What's the best way to approach atheist friends?",
    "How do I defend the historicity of Jesus Christ?"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % questions.length)
    }, 3000) // Change question every 3 seconds

    return () => clearInterval(interval)
  }, [questions.length])

  return (
    <div className="text-center">
      <p 
        key={currentIndex}
        className="text-lg md:text-xl text-[#E0E0E0] font-medium transition-all duration-500 ease-in-out animate-fade-in"
        style={{
          animation: 'fadeIn 0.5s ease-in-out'
        }}
      >
        {questions[currentIndex]}
      </p>
      <div className="flex justify-center mt-4 space-x-2">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-blue-400 scale-125' 
                : 'bg-[#9CA3AF] opacity-50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function Home() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate scroll-based color adjustments
  const scrollProgress = Math.min(scrollY / (typeof window !== 'undefined' ? window.innerHeight * 3 : 1), 1)
  const colorShift = scrollProgress * 0.3
  
  // Calculate section-specific color adjustments
  const getSectionColor = (sectionIndex: number) => {
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const sectionProgress = Math.max(0, Math.min(1, (scrollY - sectionIndex * windowHeight) / windowHeight))
    return {
      brightness: 1 + sectionProgress * 0.1,
      saturation: 1 + sectionProgress * 0.2,
      hue: sectionProgress * 5
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Dynamic Background with Scroll-based Blending */}
      <div 
        className="fixed inset-0 transition-all duration-1000 ease-out -z-10"
        style={{
          background: `linear-gradient(180deg, 
            #1A1D24 0%, 
            #1A1D24 20%, 
            #1E2128 40%, 
            #222530 60%, 
            #2A2E3A 80%, 
            #2C303A 100%)`,
          filter: `brightness(${1 + colorShift * 0.1}) saturate(${1 + colorShift * 0.2})`
        }}
      />
      
      {/* Scroll-based Color Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out -z-10"
        style={{
          background: `linear-gradient(180deg, 
            rgba(26, 29, 36, ${0.3 + colorShift * 0.2}) 0%, 
            rgba(30, 33, 40, ${0.2 + colorShift * 0.3}) 50%, 
            rgba(44, 48, 58, ${0.1 + colorShift * 0.4}) 100%)`
        }}
      />
      
      {/* Hero Section */}
      <section className="landing-section section-transition scroll-enhanced enhanced-transition relative overflow-hidden py-24" style={{
        background: `linear-gradient(135deg, 
          #1A1D24 0%, 
          #1E2128 50%, 
          #2A2E3A 100%)`,
        filter: `brightness(${getSectionColor(0).brightness}) saturate(${getSectionColor(0).saturation}) hue-rotate(${getSectionColor(0).hue}deg)`
      }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Advanced AI Christian Apologetics Agent
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-[#E0E0E0] mb-6 leading-tight">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Shield AI
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-[#9CA3AF] mb-8 max-w-4xl mx-auto leading-relaxed">
              Your advanced AI Christian Apologetics agent that combines the power of AI with biblical wisdom. 
              Get personalized spiritual guidance, study scripture, and connect with your community.
            </p>
            
            {/* Rotating Apologetics Questions */}
            <div className="mb-12 max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-[#E0E0E0] mb-6 text-center">
                Ask Shield AI about:
              </h3>
              <div className="min-h-[60px] flex items-center justify-center">
                <QuestionRotator />
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link
                href="/chat"
                className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white inline-flex items-center space-x-3 text-lg px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                <MessageCircle className="h-6 w-6" />
                <span>Start Chatting</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="/bible"
                className="group bg-[#2C303A] hover:bg-[#3A404B] text-[#E0E0E0] border border-[#3A404B] hover:border-[#4A505B] inline-flex items-center space-x-3 text-lg px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <BookOpen className="h-6 w-6" />
                <span>Explore Bible</span>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">10K+</div>
                <div className="text-[#9CA3AF]">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">50K+</div>
                <div className="text-[#9CA3AF]">Scriptures Studied</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">99%</div>
                <div className="text-[#9CA3AF]">User Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Smooth Transition Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-[#1E2128] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-b from-transparent to-[#222530] pointer-events-none opacity-60"></div>
      </section>

      {/* Features Section */}
      <section className="landing-section section-transition scroll-enhanced enhanced-transition py-24 relative" style={{
        background: `linear-gradient(180deg, 
          #1E2128 0%, 
          #222530 50%, 
          #262A36 100%)`
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-[#E0E0E0] mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-[#9CA3AF] max-w-3xl mx-auto">
              Discover how Shield AI can enhance your spiritual journey with cutting-edge technology 
              and biblical wisdom.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Bible Study Feature */}
            <div className="group bg-[#2C303A] border border-[#3A404B] rounded-2xl p-8 hover:bg-[#3A404B] hover:border-[#4A505B] transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#E0E0E0] mb-4 text-center">Bible Study</h3>
              <p className="text-[#9CA3AF] text-center leading-relaxed mb-6">
                Search and study scripture with AI-powered insights, cross-references, and personalized study plans.
              </p>
              <ul className="space-y-2 text-sm text-[#9CA3AF]">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Advanced search capabilities
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Cross-reference analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Study plan generation
                </li>
              </ul>
            </div>
            
            {/* AI Chat Feature */}
            <div className="group bg-[#2C303A] border border-[#3A404B] rounded-2xl p-8 hover:bg-[#3A404B] hover:border-[#4A505B] transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/10">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#E0E0E0] mb-4 text-center">AI Chat</h3>
              <p className="text-[#9CA3AF] text-center leading-relaxed mb-6">
                Get biblical guidance and answers to your spiritual questions with our intelligent AI assistant.
              </p>
              <ul className="space-y-2 text-sm text-[#9CA3AF]">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Scripture-based responses
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Personalized guidance
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  24/7 availability
                </li>
              </ul>
            </div>
            
            {/* Church Finder Feature */}
            <div className="group bg-[#2C303A] border border-[#3A404B] rounded-2xl p-8 hover:bg-[#3A404B] hover:border-[#4A505B] transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/10">
              <div className="bg-gradient-to-br from-green-600 to-green-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#E0E0E0] mb-4 text-center">Church Finder</h3>
              <p className="text-[#9CA3AF] text-center leading-relaxed mb-6">
                Discover local churches and Christian communities near you with detailed information and reviews.
              </p>
              <ul className="space-y-2 text-sm text-[#9CA3AF]">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Location-based search
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Service times & details
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Community reviews
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Smooth Transition Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-[#262A36] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-b from-transparent to-[#2A2E3A] pointer-events-none opacity-60"></div>
      </section>

      {/* Testimonials Section */}
      <section className="landing-section section-transition scroll-enhanced enhanced-transition py-24 relative" style={{
        background: `linear-gradient(180deg, 
          #262A36 0%, 
          #2A2E3A 50%, 
          #2E323E 100%)`
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#E0E0E0] mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl text-[#9CA3AF] max-w-3xl mx-auto">
              Join thousands of Christians who have enhanced their spiritual journey with Shield AI.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#1A1D24] border border-[#3A404B] rounded-2xl p-8">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-[#E0E0E0] mb-6 italic">
                "Shield AI has transformed my daily Bible study. The AI insights help me understand 
                scripture in ways I never thought possible."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">SM</span>
                </div>
                <div>
                  <div className="font-semibold text-[#E0E0E0]">Sarah Mitchell</div>
                  <div className="text-[#9CA3AF] text-sm">Pastor, Grace Community</div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1A1D24] border border-[#3A404B] rounded-2xl p-8">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-[#E0E0E0] mb-6 italic">
                "The church finder helped me discover an amazing community just 5 minutes from my home. 
                I'm so grateful for this tool!"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">MJ</span>
                </div>
                <div>
                  <div className="font-semibold text-[#E0E0E0]">Michael Johnson</div>
                  <div className="text-[#9CA3AF] text-sm">Software Engineer</div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1A1D24] border border-[#3A404B] rounded-2xl p-8">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-[#E0E0E0] mb-6 italic">
                "As a youth pastor, Shield AI helps me prepare engaging lessons and answer tough 
                questions from my students with biblical accuracy."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">EL</span>
                </div>
                <div>
                  <div className="font-semibold text-[#E0E0E0]">Emily Lopez</div>
                  <div className="text-[#9CA3AF] text-sm">Youth Pastor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Smooth Transition Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-[#2E323E] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-b from-transparent to-[#323640] pointer-events-none opacity-60"></div>
      </section>

      {/* Scripture of the Day Section */}
      <section className="landing-section section-transition scroll-enhanced enhanced-transition py-24 relative" style={{
        background: `linear-gradient(135deg, 
          #2E323E 0%, 
          #323640 50%, 
          #2C303A 100%)`
      }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
            <Heart className="w-4 h-4 mr-2" />
            Daily Inspiration
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-[#E0E0E0] mb-12">
            Scripture of the Day
          </h2>
          
          <div className="bg-[#2C303A] border border-[#3A404B] rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <Quote className="w-16 h-16 text-blue-400/20 absolute top-8 left-8" />
            <Quote className="w-16 h-16 text-blue-400/20 absolute bottom-8 right-8 rotate-180" />
            
            <blockquote className="text-2xl md:text-3xl text-[#E0E0E0] font-serif italic mb-8 leading-relaxed relative z-10">
              "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, 
              to give you hope and a future."
            </blockquote>
            
            <cite className="text-xl text-blue-400 font-semibold">Jeremiah 29:11</cite>
            
            <div className="mt-8">
              <Link
                href="/bible"
                className="inline-flex items-center space-x-2 text-[#9CA3AF] hover:text-blue-400 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>Read more in Bible Study</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Smooth Transition Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-[#2C303A] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-b from-transparent to-[#1A1D24] pointer-events-none opacity-60"></div>
      </section>

      {/* CTA Section */}
      <section className="landing-section section-transition scroll-enhanced enhanced-transition py-24 relative" style={{
        background: `linear-gradient(180deg, 
          #2C303A 0%, 
          #1A1D24 100%)`
      }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#E0E0E0] mb-6">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl text-[#9CA3AF] mb-12 max-w-2xl mx-auto">
            Join thousands of Christians who are growing in their faith with Shield AI. 
            Start your spiritual journey today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/chat"
              className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white inline-flex items-center space-x-3 text-lg px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
            >
              <Zap className="h-6 w-6" />
              <span>Get Started Free</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/bible"
              className="group bg-transparent border-2 border-[#3A404B] hover:border-blue-500 text-[#E0E0E0] hover:text-blue-400 inline-flex items-center space-x-3 text-lg px-10 py-4 rounded-xl transition-all duration-300"
            >
              <Play className="h-6 w-6" />
              <span>Watch Demo</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}