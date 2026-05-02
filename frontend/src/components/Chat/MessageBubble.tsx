import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, AlertCircle } from 'lucide-react';
import type { Message } from '../../types';
import { Avatar } from '../UI/Avatar';

interface MessageBubbleProps {
  message: Message;
  onFeedback: (id: string, feedback: 'up' | 'down') => void;
  onRegenerate: () => void;
  onRetry?: () => void;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div
      className="rounded-lg overflow-hidden my-2"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Code header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: '#161625', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span
          className="text-xs font-mono font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all duration-200 hover:opacity-80"
          style={{
            color: copied ? 'var(--success)' : 'var(--text-muted)',
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {/* Code content */}
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '14px 16px',
          background: '#1E1E2E',
          fontSize: '0.81rem',
          lineHeight: '1.6',
          overflowX: 'auto',
        }}
        codeTagProps={{
          style: { fontFamily: "'JetBrains Mono', monospace" },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function MessageActions({
  message,
  onFeedback,
  onRegenerate,
}: {
  message: Message;
  onFeedback: (id: string, feedback: 'up' | 'down') => void;
  onRegenerate: () => void;
}) {
  const [copiedMsg, setCopiedMsg] = useState(false);

  const handleCopyMsg = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  }, [message.content]);

  return (
    <div
      className="flex items-center gap-1 mt-1.5 ml-11 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    >
      <ActionBtn
        onClick={() => onFeedback(message.id, 'up')}
        active={message.feedback === 'up'}
        activeColor="var(--success)"
        title="Helpful"
      >
        <ThumbsUp size={14} />
      </ActionBtn>
      <ActionBtn
        onClick={() => onFeedback(message.id, 'down')}
        active={message.feedback === 'down'}
        activeColor="var(--error)"
        title="Not helpful"
      >
        <ThumbsDown size={14} />
      </ActionBtn>
      <ActionBtn onClick={handleCopyMsg} title={copiedMsg ? 'Copied!' : 'Copy'}>
        {copiedMsg ? <Check size={14} /> : <Copy size={14} />}
      </ActionBtn>
      <ActionBtn onClick={onRegenerate} title="Regenerate">
        <RotateCcw size={14} />
      </ActionBtn>
    </div>
  );
}

function ActionBtn({
  onClick,
  active,
  activeColor,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg transition-all duration-150 hover:opacity-80"
      style={{
        color: active && activeColor ? activeColor : 'var(--text-muted)',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-bg)';
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
      }}
    >
      {children}
    </button>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 120) return '1 min ago';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, onFeedback, onRegenerate, onRetry }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1 animate-fade-slide-left">
        <div className="flex items-end gap-3 max-w-[70%] md:max-w-[70%] max-w-[90%]">
          <div
            className="px-4 py-3 text-white text-sm leading-relaxed"
            style={{
              background: 'var(--user-bubble)',
              borderRadius: '18px 18px 4px 18px',
              boxShadow: '0 4px 16px rgba(124,58,237,0.25)',
            }}
          >
            {message.imageData && (
              <img
                src={message.imageData}
                alt="Uploaded"
                className="rounded-lg mb-2 max-h-48 object-contain"
                style={{ maxWidth: '100%' }}
              />
            )}
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.content}
            </span>
          </div>
          <Avatar type="user" />
        </div>
        <span
          className="text-xs mr-11"
          style={{ color: 'var(--text-muted)' }}
        >
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    );
  }

  // AI message
  return (
    <div className="group flex flex-col gap-0 animate-fade-slide-right">
      <div className="flex items-start gap-3 max-w-[85%] md:max-w-[85%] max-w-[95%]">
        <Avatar type="ai" />
        <div
          className="flex-1 px-5 py-4 text-sm leading-relaxed min-w-0"
          style={{
            background: 'var(--ai-bubble)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-default)',
            borderLeft: message.isError
              ? '3px solid var(--error)'
              : '3px solid var(--accent-primary)',
            borderRadius: '4px 18px 18px 18px',
          }}
        >
          {message.isError ? (
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} style={{ color: 'var(--error)', flexShrink: 0, marginTop: '2px' }} />
              <div className="flex-1">
                <p style={{ color: 'var(--text-secondary)' }}>{message.content}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      color: 'var(--error)',
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isBlock = !!match;
                    if (isBlock) {
                      return (
                        <CodeBlock
                          language={match[1]}
                          code={String(children).replace(/\n$/, '')}
                        />
                      );
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && (
                <span
                  className="animate-blink inline-block ml-0.5"
                  style={{
                    width: '2px',
                    height: '1em',
                    background: 'var(--accent-primary)',
                    verticalAlign: 'text-bottom',
                  }}
                />
              )}
              {message.isStopped && (
                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                  (stopped)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {!message.isError && !message.isStreaming && (
        <MessageActions
          message={message}
          onFeedback={onFeedback}
          onRegenerate={onRegenerate}
        />
      )}
    </div>
  );
}
