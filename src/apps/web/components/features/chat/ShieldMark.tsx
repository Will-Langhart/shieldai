import React from 'react'

/**
 * Single-color shield-and-cross mark for the chat. Uses currentColor so it
 * picks up the warm brand tone in both chat themes (the full-color logo.png
 * stays the identity mark elsewhere on the site).
 */
export function ShieldMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2.25 4.5 5.1v6.15c0 4.7 3.15 8.85 7.5 10.5 4.35-1.65 7.5-5.8 7.5-10.5V5.1L12 2.25Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 7.25v9M8.75 10.5h6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
