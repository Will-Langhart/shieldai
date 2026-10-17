import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'

/**
 * Renders assistant message content as markdown, styled to match the Shield
 * theme with a Claude/OpenAI-style reading experience (headings, lists, tables,
 * fenced code blocks with copy buttons, blockquotes, links).
 */

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      const text = typeof children === 'string' ? children : extractText(children)
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="group/code relative my-3">
      <button
        onClick={copy}
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-shield-edge bg-shield-surface/90 px-2 py-1 font-sans text-[11px] text-shield-muted opacity-0 backdrop-blur transition-opacity hover:text-shield-fg group-hover/code:opacity-100"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-x-auto rounded-xl border border-shield-edge/70 bg-shield-void/70 p-4 font-mono text-[13px] leading-relaxed">
        {children}
      </pre>
    </div>
  )
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (React.isValidElement(node)) return extractText((node.props as any).children)
  return ''
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="shield-markdown font-serif text-[16.5px] leading-[1.75] text-shield-fg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-semibold first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-5 text-lg font-semibold first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-2 mt-4 font-sans text-xs font-semibold uppercase tracking-wide text-shield-muted first:mt-0">{children}</h4>,
          ul: ({ children }) => <ul className="mb-4 ml-1 list-disc space-y-2 pl-5 marker:text-shield-muted last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 ml-1 list-decimal space-y-2 pl-5 marker:text-shield-muted last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-shield-fg">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-shield-brand underline decoration-shield-brand/40 underline-offset-2 transition-colors hover:decoration-shield-brand"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-shield-brand/60 pl-4 italic text-shield-fg/75">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-shield-edge" />,
          code: ({ className, children, ...props }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="rounded-[5px] border border-shield-edge/60 bg-shield-void/60 px-1.5 py-0.5 font-mono text-[0.82em] text-shield-brand-dim" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse font-sans text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b border-shield-edge-strong">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-shield-fg">{children}</th>,
          td: ({ children }) => <td className="border-b border-shield-edge/70 px-3 py-2 align-top text-shield-fg/90">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
