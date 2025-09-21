import React from 'react'

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-t from-[#1A1D24] to-[#2C303A] border-t border-[#2C303A] landing-section section-transition">
      {/* Smooth Transition Overlay */}
      <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#2C303A] to-transparent pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-[#E0E0E0]">Shield AI</span>
            </div>
            <p className="text-[#9CA3AF] text-sm max-w-md">
              Your Christian AI assistant for Bible study, spiritual guidance, and church discovery. 
              Built with faith and technology to serve the Kingdom.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-[#E0E0E0] uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="/bible" className="text-[#9CA3AF] hover:text-[#E0E0E0] text-sm transition-colors">
                  Bible Study
                </a>
              </li>
              <li>
                <a href="/chat" className="text-[#9CA3AF] hover:text-[#E0E0E0] text-sm transition-colors">
                  AI Chat
                </a>
              </li>
              <li>
                <a href="/churches" className="text-[#9CA3AF] hover:text-[#E0E0E0] text-sm transition-colors">
                  Find Churches
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-[#E0E0E0] uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="/help" className="text-[#9CA3AF] hover:text-[#E0E0E0] text-sm transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/contact" className="text-[#9CA3AF] hover:text-[#E0E0E0] text-sm transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-[#9CA3AF] hover:text-[#E0E0E0] text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#3A404B]">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#9CA3AF] text-sm">
              © 2024 Shield AI. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-[#9CA3AF] text-sm italic">
                "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future." - Jeremiah 29:11
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer