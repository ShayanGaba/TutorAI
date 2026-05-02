import React, { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { Zap } from "lucide-react";
import type { Message, AIMode } from "../../types";
import { MODES } from "../../types";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  isThinking: boolean;
  currentMode: AIMode;
  onSuggestion?: (text: string) => void;
  onFeedback?: (id: string, type: "up" | "down") => void;
  onRegenerate?: () => void;
  onRetry?: (content: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  isThinking,
  currentMode,
  onSuggestion,
  onFeedback,
  onRegenerate,
  onRetry,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const mode = MODES[currentMode];
  const { Icon } = mode;

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: "24px 16px" }}>
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-full py-12">
          {/* Logo */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #4C1D95)",
              boxShadow: "0 0 40px rgba(124,58,237,0.35)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          >
            <Zap size={28} color="white" fill="white" />
          </div>

          <h1
            className="font-bold text-center mb-2"
            style={{
              color: "var(--text-primary)",
              fontSize: "28px",
              letterSpacing: "-0.02em",
            }}
          >
            Hello, I'm {mode.name} 👋
          </h1>

          <p
            className="text-center mb-10"
            style={{
              color: "var(--text-secondary)",
              fontSize: "16px",
              maxWidth: "400px",
            }}
          >
            {mode.subtitle}
          </p>

          {/* Suggestion chips — no emojis, just clean text with icon */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full"
            style={{ maxWidth: "600px" }}
          >
            {mode.chips.map((chip, i) => (
              <button
                key={i}
                onClick={() => onSuggestion?.(chip.text)}
                className="flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "var(--glass-bg-hover)";
                  el.style.borderColor = "rgba(124,58,237,0.5)";
                  el.style.color = "var(--text-primary)";
                  el.style.transform = "scale(1.02)";
                  el.style.boxShadow = "0 4px 20px rgba(124,58,237,0.12)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "var(--glass-bg)";
                  el.style.borderColor = "var(--border-default)";
                  el.style.color = "var(--text-secondary)";
                  el.style.transform = "scale(1)";
                  el.style.boxShadow = "none";
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(124,58,237,0.15)" }}
                >
                  <Icon size={14} style={{ color: "#A78BFA" }} />
                </div>
                <span style={{ fontSize: "14px", lineHeight: "1.4" }}>
                  {chip.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto w-full">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              id={msg.id}
              role={msg.role}
              content={msg.content}
              imageData={msg.imageData}
              isStreaming={msg.isStreaming}
              isError={msg.isError}
              isStopped={msg.isStopped}
              timestamp={msg.timestamp}
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
              feedback={msg.feedback}
            />
          ))}

          {isThinking && (
            <div className="flex justify-start mb-4 px-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #4C1D95)",
                  boxShadow: "0 0 12px rgba(124,58,237,0.4)",
                }}
              >
                <Zap size={14} color="white" fill="white" />
              </div>
              <ThinkingIndicator />
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 40px rgba(124,58,237,0.35); }
          50% { box-shadow: 0 0 60px rgba(124,58,237,0.6); }
        }
      `}</style>
    </div>
  );
};
