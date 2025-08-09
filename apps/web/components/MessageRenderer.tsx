import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Code, Download, ExternalLink, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';

interface MessageRendererProps {
  content: string;
  theme?: 'light' | 'dark';
  className?: string;
  animated?: boolean;
  onCopy?: (text: string) => void;
}

interface CodeBlock {
  language: string;
  code: string;
  startIndex: number;
  endIndex: number;
}

interface ListItem {
  type: 'ordered' | 'unordered';
  items: string[];
  startIndex: number;
  endIndex: number;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({
  content,
  theme = 'dark',
  className = '',
  animated = true,
  onCopy
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // Animation effect for streaming text
  useEffect(() => {
    if (!animated) {
      setDisplayedContent(content);
      return;
    }

    setIsAnimating(true);
    setDisplayedContent('');
    
    let currentIndex = 0;
    const animationSpeed = Math.max(10, Math.min(50, 3000 / content.length)); // Adaptive speed
    
    const timer = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(timer);
        setIsAnimating(false);
      }
    }, animationSpeed);

    return () => clearInterval(timer);
  }, [content, animated]);

  // Parse content for special formatting
  const parseContent = (text: string) => {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Find code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    const boldRegex = /\*\*(.*?)\*\*/g;
    const italicRegex = /\*(.*?)\*/g;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const listRegex = /^(\s*)([-*+]|\d+\.)\s+(.+)$/gm;
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const quoteRegex = /^>\s+(.+)$/gm;

    // Process code blocks first
    let match;
    const codeBlocks: CodeBlock[] = [];
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    // Process the text segment by segment
    let currentPos = 0;
    
    codeBlocks.forEach((codeBlock, index) => {
      // Add text before code block
      if (currentPos < codeBlock.startIndex) {
        const textBeforeCode = text.slice(currentPos, codeBlock.startIndex);
        elements.push(
          <span key={`text-${index}-before`}>
            {renderFormattedText(textBeforeCode)}
          </span>
        );
      }

      // Add code block
      elements.push(renderCodeBlock(codeBlock, index));
      currentPos = codeBlock.endIndex;
    });

    // Add remaining text
    if (currentPos < text.length) {
      const remainingText = text.slice(currentPos);
      elements.push(
        <span key="text-remaining">
          {renderFormattedText(remainingText)}
        </span>
      );
    }

    return elements;
  };

  const renderFormattedText = (text: string) => {
    // Apply inline formatting
    let formattedText = text;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Handle headings
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    while ((match = headingRegex.exec(formattedText)) !== null) {
      const level = match[1].length;
      const headingText = match[2];
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      
      parts.push(
        <HeadingTag
          key={`heading-${match.index}`}
          className={`font-bold mb-2 mt-4 ${getHeadingClasses(level, theme)}`}
        >
          {headingText}
        </HeadingTag>
      );
    }

    // Handle lists
    const listRegex = /^(\s*)([-*+]|\d+\.)\s+(.+)$/gm;
    const listItems: string[] = [];
    let listType: 'ordered' | 'unordered' | null = null;
    
    formattedText.split('\n').forEach((line, lineIndex) => {
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
      if (listMatch) {
        const isOrdered = /\d+\./.test(listMatch[2]);
        if (listType === null) {
          listType = isOrdered ? 'ordered' : 'unordered';
        }
        listItems.push(listMatch[3]);
      } else if (listItems.length > 0) {
        // End of list
        parts.push(renderList(listItems, listType!, `list-${lineIndex}`));
        listItems.length = 0;
        listType = null;
      }
    });

    // Render remaining list if any
    if (listItems.length > 0 && listType) {
      parts.push(renderList(listItems, listType, 'list-final'));
    }

    // Handle other inline formatting if no special structures found
    if (parts.length === 0) {
      return renderInlineFormatting(formattedText);
    }

    return parts;
  };

  const renderInlineFormatting = (text: string) => {
    let result = text;
    
    // Bold text
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Italic text
    result = result.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Inline code
    result = result.replace(/`([^`]+)`/g, (match, code) => {
      return `<code class="${getInlineCodeClasses(theme)}">${code}</code>`;
    });
    
    // Links
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${getLinkClasses(theme)}">${text}</a>`;
    });

    // Line breaks
    result = result.replace(/\n/g, '<br />');

    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  const renderCodeBlock = (codeBlock: CodeBlock, index: number) => {
    const codeId = `code-${index}`;
    const isCopied = copiedStates[codeId];

    return (
      <div
        key={codeId}
        className={`my-4 rounded-lg border overflow-hidden ${
          theme === 'dark'
            ? 'bg-gray-900 border-gray-700'
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        {/* Code block header */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-300'
            : 'bg-gray-100 border-gray-200 text-gray-600'
        }`}>
          <div className="flex items-center space-x-2">
            <Code size={14} />
            <span className="text-sm font-medium capitalize">
              {codeBlock.language}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleCopyCode(codeBlock.code, codeId)}
              className={`p-1.5 rounded transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
              }`}
              title={isCopied ? 'Copied!' : 'Copy code'}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <button
              onClick={() => handleDownloadCode(codeBlock.code, codeBlock.language)}
              className={`p-1.5 rounded transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
              }`}
              title="Download code"
            >
              <Download size={14} />
            </button>
          </div>
        </div>
        
        {/* Code content */}
        <div className="p-4 overflow-x-auto">
          <pre className={`text-sm leading-relaxed ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
          }`}>
            <code className="block whitespace-pre-wrap break-words">
              {highlightCode(codeBlock.code, codeBlock.language)}
            </code>
          </pre>
        </div>
      </div>
    );
  };

  const renderList = (items: string[], type: 'ordered' | 'unordered', key: string) => {
    const ListTag = type === 'ordered' ? 'ol' : 'ul';
    
    return (
      <ListTag
        key={key}
        className={`my-3 space-y-1 ${
          type === 'ordered' ? 'list-decimal' : 'list-disc'
        } list-inside ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}
      >
        {items.map((item, index) => (
          <li key={index} className="leading-relaxed">
            {renderInlineFormatting(item)}
          </li>
        ))}
      </ListTag>
    );
  };

  const highlightCode = (code: string, language: string) => {
    // Basic syntax highlighting for common languages
    if (language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
      return highlightJavaScript(code);
    } else if (language === 'python' || language === 'py') {
      return highlightPython(code);
    } else if (language === 'html') {
      return highlightHTML(code);
    } else if (language === 'css') {
      return highlightCSS(code);
    }
    return code;
  };

  const highlightJavaScript = (code: string) => {
    const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'from', 'default'];
    let highlighted = code;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="${getKeywordClasses(theme)}">${keyword}</span>`);
    });
    
    // Highlight strings
    highlighted = highlighted.replace(/(["'`])(.*?)\1/g, `<span class="${getStringClasses(theme)}">$1$2$1</span>`);
    
    // Highlight comments
    highlighted = highlighted.replace(/(\/\/.*$)/gm, `<span class="${getCommentClasses(theme)}">$1</span>`);
    
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const highlightPython = (code: string) => {
    const keywords = ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally'];
    let highlighted = code;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="${getKeywordClasses(theme)}">${keyword}</span>`);
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const highlightHTML = (code: string) => {
    let highlighted = code;
    
    // Highlight tags
    highlighted = highlighted.replace(/(<\/?[^>]+>)/g, `<span class="${getTagClasses(theme)}">$1</span>`);
    
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const highlightCSS = (code: string) => {
    let highlighted = code;
    
    // Highlight selectors
    highlighted = highlighted.replace(/([.#]?[\w-]+)(\s*{)/g, `<span class="${getSelectorClasses(theme)}">$1</span>$2`);
    
    // Highlight properties
    highlighted = highlighted.replace(/([\w-]+)(:)/g, `<span class="${getPropertyClasses(theme)}">$1</span>$2`);
    
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const handleCopyCode = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedStates(prev => ({ ...prev, [codeId]: true }));
      onCopy?.(code);
      
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [codeId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleDownloadCode = (code: string, language: string) => {
    const extension = getFileExtension(language);
    const filename = `code.${extension}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      sql: 'sql',
      bash: 'sh',
      shell: 'sh'
    };
    return extensions[language.toLowerCase()] || 'txt';
  };

  // Theme-specific classes
  const getHeadingClasses = (level: number, theme: string) => {
    const sizeClasses = {
      1: 'text-2xl',
      2: 'text-xl',
      3: 'text-lg',
      4: 'text-base',
      5: 'text-sm',
      6: 'text-xs'
    };
    
    const colorClass = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
    return `${sizeClasses[level as keyof typeof sizeClasses]} ${colorClass}`;
  };

  const getInlineCodeClasses = (theme: string) => {
    return theme === 'dark'
      ? 'bg-gray-800 text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono'
      : 'bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono';
  };

  const getLinkClasses = (theme: string) => {
    return theme === 'dark'
      ? 'text-blue-400 hover:text-blue-300 underline transition-colors'
      : 'text-blue-600 hover:text-blue-800 underline transition-colors';
  };

  const getKeywordClasses = (theme: string) => {
    return theme === 'dark' ? 'text-purple-400 font-medium' : 'text-purple-600 font-medium';
  };

  const getStringClasses = (theme: string) => {
    return theme === 'dark' ? 'text-green-400' : 'text-green-600';
  };

  const getCommentClasses = (theme: string) => {
    return theme === 'dark' ? 'text-gray-500 italic' : 'text-gray-400 italic';
  };

  const getTagClasses = (theme: string) => {
    return theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
  };

  const getSelectorClasses = (theme: string) => {
    return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
  };

  const getPropertyClasses = (theme: string) => {
    return theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600';
  };

  return (
    <div
      ref={contentRef}
      className={`message-content prose prose-sm max-w-none ${
        theme === 'dark' ? 'prose-invert' : ''
      } ${className} ${animated ? 'message-fade-in' : ''}`}
    >
      {parseContent(displayedContent)}
      {isAnimating && (
        <span className={`inline-block w-2 h-5 ml-1 animate-pulse ${
          theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
        }`} />
      )}
    </div>
  );
};

export default MessageRenderer;