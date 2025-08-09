import React, { useState } from 'react';
import ChurchFinder from '../components/ChurchFinder';

export default function TestChurchFinder() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Church Finder Test</h1>
        
        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Church Finder
        </button>

        <ChurchFinder
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          theme="light"
          onChurchSelect={(church) => {
            console.log('Selected church:', church);
            alert(`Selected: ${church.name}`);
          }}
        />
      </div>
    </div>
  );
} 