'use client'

import { useMemo } from 'react'

interface MarkdownContentProps {
  content: string | unknown
  className?: string
}

/**
 * Simple markdown renderer for AI chatbot messages
 * Handles common markdown formatting: bold, italic, lists, code, links
 */
export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  const rendered = useMemo(() => {
    // Ensure content is a string
    let text: string
    if (typeof content === 'string') {
      text = content
    } else if (Array.isArray(content)) {
      text = content.map((c: unknown) => typeof c === 'string' ? c : String(c)).join('')
    } else {
      text = String(content || '')
    }
    
    // Split by double newlines to handle paragraphs
    const paragraphs = text.split(/\n\n+/)
    
    return paragraphs.map((paragraph, pIdx) => {
      // Skip empty paragraphs
      if (!paragraph.trim()) return null
      
      // Check for list
      if (/^[\d\-\*\+]\.?\s/.test(paragraph.trim())) {
        const lines = paragraph.split('\n')
        const items = lines
          .filter(line => /^[\d\-\*\+]\.?\s/.test(line.trim()))
          .map(line => line.replace(/^[\d\-\*\+]\.?\s+/, '').trim())
        
        if (items.length > 0) {
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-1 my-2 ml-2">
              {items.map((item, idx) => (
                <li key={idx} className="markdown-list-item">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          )
        }
      }
      
      // Check for heading (###, ##, #)
      const headingMatch = paragraph.match(/^(#{1,3})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const text = headingMatch[2]
        const HeadingTag = `h${level + 3}` as 'h4' | 'h5' | 'h6'
        return (
          <HeadingTag key={pIdx} className={`font-semibold mt-3 mb-2 ${level === 1 ? 'text-base' : level === 2 ? 'text-sm' : 'text-xs'}`}>
            {renderInlineMarkdown(text)}
          </HeadingTag>
        )
      }
      
      // Regular paragraph
      return (
        <p key={pIdx} className="my-2 leading-relaxed">
          {renderInlineMarkdown(paragraph)}
        </p>
      )
    }).filter(Boolean)
  }, [content])
  
  return (
    <div className={`markdown-content ${className}`}>
      {rendered}
    </div>
  )
}

/**
 * Renders inline markdown: **bold**, *italic*, `code`, [links](url)
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let currentIndex = 0
  let key = 0
  
  // Pattern for: **bold**, *italic*, `code`, [link](url)
  const patterns = [
    { regex: /\*\*([^*]+)\*\*/g, component: (match: string) => <strong key={key++}>{match}</strong> },
    { regex: /\*([^*]+)\*/g, component: (match: string) => <em key={key++}>{match}</em> },
    { regex: /`([^`]+)`/g, component: (match: string) => <code key={key++} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{match}</code> },
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, component: (text: string, url: string) => <a key={key++} href={url} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">{text}</a> },
  ]
  
  // Find all matches with their positions
  interface Match {
    start: number
    end: number
    component: React.ReactNode
  }
  
  const matches: Match[] = []
  
  patterns.forEach(({ regex, component }) => {
    let match
    const regexCopy = new RegExp(regex.source, regex.flags)
    while ((match = regexCopy.exec(text)) !== null) {
      const start = match.index || 0
      const end = start + match[0].length
      matches.push({
        start,
        end,
        component: component(match[1], match[2]), // match[1] is capture group, match[2] is second capture group (for links)
      })
    }
  })
  
  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start)
  
  // Remove overlapping matches (keep the first one)
  const nonOverlapping: Match[] = []
  for (const match of matches) {
    if (nonOverlapping.length === 0 || match.start >= nonOverlapping[nonOverlapping.length - 1].end) {
      nonOverlapping.push(match)
    }
  }
  
  // Build the result
  nonOverlapping.forEach((match) => {
    // Add text before the match
    if (match.start > currentIndex) {
      parts.push(text.substring(currentIndex, match.start))
    }
    // Add the matched component
    parts.push(match.component)
    currentIndex = match.end
  })
  
  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex))
  }
  
  // If no matches, return the original text
  if (parts.length === 0) {
    return [text]
  }
  
  return parts
}

