import React from 'react'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="landing-section relative bg-transparent">
      <div className="shield-page-shell relative z-10 py-10 sm:py-12">
        <div className="shield-glass-panel px-6 py-8 sm:px-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg" />
              <span className="font-serif text-xl font-semibold text-shield-fg">Shield AI</span>
            </div>
            <p className="text-shield-muted text-sm max-w-md">
              Your Christian AI assistant for Bible study and spiritual guidance. 
              Built with faith and technology to serve the Kingdom.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-shield-fg uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/bible" className="text-shield-muted hover:text-shield-fg text-sm transition-colors">
                  Bible Study
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-shield-muted hover:text-shield-fg text-sm transition-colors">
                  AI Chat
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-shield-fg uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="/help" className="text-shield-muted hover:text-shield-fg text-sm transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/contact" className="text-shield-muted hover:text-shield-fg text-sm transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-shield-muted hover:text-shield-fg text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-shield-edge/60 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-shield-muted text-sm">
              © 2024 Shield AI. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-shield-muted text-sm italic">
                "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future." - Jeremiah 29:11
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer