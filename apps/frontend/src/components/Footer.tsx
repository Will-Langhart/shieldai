import { Shield, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-primary-400" />
              <span className="text-lg font-bold">Shield AI</span>
            </div>
            <p className="text-gray-400 text-sm">
              Your Christian AI assistant with Bible integration and church finder capabilities.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Bible Study & Search</li>
              <li>AI Chat Assistant</li>
              <li>Church Finder</li>
              <li>Scripture Integration</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Scripture
            </h3>
            <blockquote className="text-sm text-gray-400 italic">
              "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life."
            </blockquote>
            <cite className="text-xs text-gray-500 block mt-2">John 3:16</cite>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            © 2024 Shield AI. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 flex items-center space-x-1 mt-4 md:mt-0">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>for the Kingdom</span>
          </p>
        </div>
      </div>
    </footer>
  )
}


