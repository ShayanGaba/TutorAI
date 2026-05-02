import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";

interface ChatMessageProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageData?: string;
  isStreaming?: boolean;
  isError?: boolean;
  isStopped?: boolean;
  timestamp: Date;
  onFeedback?: (id: string, type: "up" | "down") => void;
  onRegenerate?: () => void;
  feedback?: "up" | "down" | null;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  role,
  content,
  imageData,
  isStreaming,
  isError,
  isStopped,
  timestamp,
  onFeedback,
  onRegenerate,
  feedback,
}) => {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCodeCopied(id);
    setTimeout(() => setCodeCopied(null), 2000);
  };

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 px-2">
        <div className="flex flex-col items-end gap-1 max-w-[75%]">
          {/* Image preview if attached */}
          {imageData && (
            <div className="mb-2">
              <img
                src={imageData}
                alt="Uploaded"
                className="rounded-xl max-w-[280px] max-h-[200px] object-cover"
                style={{
                  border: "2px solid rgba(124,58,237,0.4)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.2)",
                }}
              />
            </div>
          )}

          {/* User bubble */}
          {content && (
            <div
              className="px-4 py-3 rounded-2xl rounded-br-sm text-white text-sm leading-relaxed"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "15px",
              }}
            >
              <p className="whitespace-pre-wrap">{content}</p>
            </div>
          )}

          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            {formatTime(timestamp)}
          </span>
        </div>

        {/* User Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ml-3 flex-shrink-0 self-end mb-5"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            color: "white",
          }}
        >
          U
        </div>
      </div>
    );
  }

  // AI Message
  return (
    <div
      className="flex justify-start mb-6 px-2 group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* AI Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 self-start mt-1 mr-3"
        style={{
          background: "linear-gradient(135deg, #7C3AED, #4C1D95)",
          boxShadow: "0 0 12px rgba(124,58,237,0.4)",
        }}
      >
        <span style={{ fontSize: "14px" }}>⚡</span>
      </div>

      <div className="flex flex-col gap-1 max-w-[85%] md:max-w-[75%]">
        {/* AI Bubble */}
        <div
          className="px-5 py-4 rounded-2xl rounded-tl-sm relative"
          style={{
            background: isError
              ? "rgba(239,68,68,0.08)"
              : "rgba(255,255,255,0.05)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: isError
              ? "1px solid rgba(239,68,68,0.3)"
              : "1px solid rgba(255,255,255,0.1)",
            borderLeft: isError ? "3px solid #EF4444" : "3px solid #7C3AED",
          }}
        >
          {/* Markdown content */}
          <div
            className="prose prose-invert prose-sm max-w-none"
            style={{
              color: isError ? "#FCA5A5" : "var(--text-primary)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "15px",
              lineHeight: "1.7",
            }}
          >
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeStr = String(children).replace(/\n$/, "");
                  const codeId = `${id}-${codeStr.slice(0, 10)}`;

                  if (!inline && match) {
                    return (
                      <div
                        className="my-3 rounded-xl overflow-hidden"
                        style={{
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {/* Code header */}
                        <div
                          className="flex items-center justify-between px-4 py-2"
                          style={{
                            background: "#0D0D1A",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <span
                            style={{
                              color: "#7C3AED",
                              fontSize: "12px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {match[1]}
                          </span>
                          <button
                            onClick={() => handleCodeCopy(codeStr, codeId)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200"
                            style={{
                              color:
                                codeCopied === codeId ? "#10B981" : "#64748B",
                              fontSize: "12px",
                              background: "rgba(255,255,255,0.04)",
                            }}
                          >
                            {codeCopied === codeId ? (
                              <>
                                <Check size={13} /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={13} /> Copy
                              </>
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            background: "#0A0A0F",
                            padding: "16px",
                            fontSize: "13px",
                            fontFamily:
                              "'JetBrains Mono', 'Fira Code', monospace",
                          }}
                          {...props}
                        >
                          {codeStr}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }

                  return (
                    <code
                      style={{
                        background: "rgba(124,58,237,0.15)",
                        color: "#A78BFA",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },

                p({ children }: any) {
                  return (
                    <p style={{ marginBottom: "12px", lineHeight: "1.75" }}>
                      {children}
                    </p>
                  );
                },

                ul({ children }: any) {
                  return (
                    <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
                      {children}
                    </ul>
                  );
                },

                ol({ children }: any) {
                  return (
                    <ol style={{ paddingLeft: "20px", marginBottom: "12px" }}>
                      {children}
                    </ol>
                  );
                },

                li({ children }: any) {
                  return (
                    <li style={{ marginBottom: "6px", lineHeight: "1.65" }}>
                      {children}
                    </li>
                  );
                },

                h1({ children }: any) {
                  return (
                    <h1
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#F8FAFC",
                        marginBottom: "12px",
                        marginTop: "20px",
                      }}
                    >
                      {children}
                    </h1>
                  );
                },

                h2({ children }: any) {
                  return (
                    <h2
                      style={{
                        fontSize: "17px",
                        fontWeight: 600,
                        color: "#F8FAFC",
                        marginBottom: "10px",
                        marginTop: "16px",
                      }}
                    >
                      {children}
                    </h2>
                  );
                },

                h3({ children }: any) {
                  return (
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#E2E8F0",
                        marginBottom: "8px",
                        marginTop: "12px",
                      }}
                    >
                      {children}
                    </h3>
                  );
                },

                blockquote({ children }: any) {
                  return (
                    <blockquote
                      style={{
                        borderLeft: "3px solid #7C3AED",
                        paddingLeft: "16px",
                        margin: "12px 0",
                        color: "#94A3B8",
                        fontStyle: "italic",
                        background: "rgba(124,58,237,0.05)",
                        borderRadius: "0 8px 8px 0",
                        padding: "10px 16px",
                      }}
                    >
                      {children}
                    </blockquote>
                  );
                },

                hr() {
                  return (
                    <hr
                      style={{
                        border: "none",
                        borderTop: "1px solid rgba(124,58,237,0.3)",
                        margin: "16px 0",
                      }}
                    />
                  );
                },

                a({ href, children }: any) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#818CF8", textDecoration: "underline" }}
                    >
                      {children}
                    </a>
                  );
                },

                strong({ children }: any) {
                  return (
                    <strong style={{ color: "#F1F5F9", fontWeight: 600 }}>
                      {children}
                    </strong>
                  );
                },

                table({ children }: any) {
                  return (
                    <div style={{ overflowX: "auto", margin: "12px 0" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "14px",
                        }}
                      >
                        {children}
                      </table>
                    </div>
                  );
                },

                th({ children }: any) {
                  return (
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        background: "rgba(124,58,237,0.15)",
                        color: "#A78BFA",
                        fontWeight: 600,
                        borderBottom: "1px solid rgba(124,58,237,0.3)",
                      }}
                    >
                      {children}
                    </th>
                  );
                },

                td({ children }: any) {
                  return (
                    <td
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        color: "#CBD5E1",
                      }}
                    >
                      {children}
                    </td>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>

            {/* Streaming cursor */}
            {isStreaming && (
              <span
                style={{
                  display: "inline-block",
                  width: "2px",
                  height: "16px",
                  background: "#7C3AED",
                  marginLeft: "2px",
                  verticalAlign: "middle",
                  borderRadius: "1px",
                  opacity: showCursor ? 1 : 0,
                  transition: "opacity 0.1s",
                }}
              />
            )}

            {/* Stopped indicator */}
            {isStopped && (
              <span
                style={{
                  color: "#64748B",
                  fontSize: "12px",
                  fontStyle: "italic",
                }}
              >
                {" "}
                (stopped)
              </span>
            )}
          </div>
        </div>

        {/* Actions row */}
        <div
          className="flex items-center gap-1 ml-1 transition-all duration-200"
          style={{ opacity: showActions && !isStreaming ? 1 : 0 }}
        >
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "11px",
              marginRight: "4px",
            }}
          >
            {formatTime(timestamp)}
          </span>

          {/* Copy message */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200"
            style={{
              color: copied ? "#10B981" : "#475569",
              fontSize: "12px",
              background: "transparent",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#94A3B8")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = copied
                ? "#10B981"
                : "#475569")
            }
            title="Copy message"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>

          {/* Thumbs up */}
          {onFeedback && (
            <button
              onClick={() => onFeedback(id, "up")}
              className="p-1 rounded-lg transition-all duration-200"
              style={{ color: feedback === "up" ? "#10B981" : "#475569" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  feedback === "up" ? "#10B981" : "#94A3B8")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  feedback === "up" ? "#10B981" : "#475569")
              }
              title="Good response"
            >
              <ThumbsUp size={13} />
            </button>
          )}

          {/* Thumbs down */}
          {onFeedback && (
            <button
              onClick={() => onFeedback(id, "down")}
              className="p-1 rounded-lg transition-all duration-200"
              style={{ color: feedback === "down" ? "#EF4444" : "#475569" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  feedback === "down" ? "#EF4444" : "#94A3B8")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  feedback === "down" ? "#EF4444" : "#475569")
              }
              title="Bad response"
            >
              <ThumbsDown size={13} />
            </button>
          )}

          {/* Regenerate */}
          {onRegenerate && !isStreaming && (
            <button
              onClick={onRegenerate}
              className="p-1 rounded-lg transition-all duration-200"
              style={{ color: "#475569" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#94A3B8")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#475569")
              }
              title="Regenerate"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
