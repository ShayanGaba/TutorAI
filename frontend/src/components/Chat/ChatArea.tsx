import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { FlashcardQuiz, StudyActions } from "./FlashcardQuiz";
import { Zap, ArrowDown } from "lucide-react";
import type { Message, AIMode } from "../../types";
import { MODES } from "../../types"; // ADD THIS IMPORT

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  isThinking: boolean;
  currentMode: AIMode;
  onSuggestion?: (text: string) => void;
  onFeedback?: (id: string, type: "up" | "down") => void;
  onRegenerate?: () => void;
  onRetry?: () => void;
  onModeChange?: (mode: AIMode) => void;
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
  onModeChange,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const isAutoScrolling = useRef(false);
  const userScrolledUp = useRef(false);

  // Flashcard/Quiz state
  const [activeStudy, setActiveStudy] = useState<{
    msgId: string;
    mode: "flashcard" | "quiz";
  } | null>(null);

  const prevMsgCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMsgCount.current) setActiveStudy(null);
    prevMsgCount.current = messages.length;
  }, [messages.length]);

  const isCurrentlyStreaming = messages.some((m) => m.isStreaming);

  const mode = MODES[currentMode]; // GET MODE CONFIG
  const { Icon } = mode; // GET ICON

  // ── Scroll helpers ────────────────────────────────────────────────────────
  const getDistFromBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    return el.scrollHeight - el.scrollTop - el.clientHeight;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current;
    if (!el) return;
    isAutoScrolling.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 400);
  }, []);

  const handleScroll = useCallback(() => {
    const near = getDistFromBottom() < 100;
    setShowScrollBtn(!near && (isCurrentlyStreaming || isThinking));
    if (!isAutoScrolling.current) userScrolledUp.current = !near;
  }, [getDistFromBottom, isCurrentlyStreaming, isThinking]);

  // Auto-scroll when content arrives — skip if user scrolled up
  useEffect(() => {
    if (!userScrolledUp.current) scrollToBottom("smooth");
  }, [messages, isThinking, scrollToBottom]);

  // Always scroll on new user message
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      userScrolledUp.current = false;
      scrollToBottom("smooth");
    }
  }, [messages.length, scrollToBottom]);

  // Reset scroll lock when thinking starts
  useEffect(() => {
    if (isThinking) userScrolledUp.current = false;
  }, [isThinking]);

  // Hide jump button when generation stops
  useEffect(() => {
    if (!isCurrentlyStreaming && !isThinking) setShowScrollBtn(false);
  }, [isCurrentlyStreaming, isThinking]);

  // Last completed AI message eligible for flashcards/quiz
  const lastAiMsgId = [...messages]
    .reverse()
    .find(
      (m) =>
        m.role === "assistant" &&
        !m.isStreaming &&
        !m.isError &&
        !m.isStopped &&
        m.content.length > 100,
    )?.id;

  return (
    <div className="flex-1 overflow-hidden relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
        style={{
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* WELCOME SCREEN — Shows when no messages (blank chat area)          */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full py-8 sm:py-12 px-4">
            {/* Logo */}
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-6"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #4C1D95)",
                boxShadow: "0 0 40px rgba(124,58,237,0.35)",
                animation: "pulse-glow 3s ease-in-out infinite",
              }}
            >
              <Zap size={24} sm:size={28} color="white" fill="white" />
            </div>

            {/* Title */}
            <h1
              className="font-bold text-center mb-2 text-xl sm:text-[28px]"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Hello, I'm {mode.name} 👋
            </h1>

            {/* Subtitle */}
            <p
              className="text-center mb-6 sm:mb-10 text-sm sm:text-base px-4"
              style={{
                color: "var(--text-secondary)",
                maxWidth: "400px",
              }}
            >
              {mode.subtitle}
            </p>

            {/* Suggestion Chips */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full px-2"
              style={{ maxWidth: "600px" }}
            >
              {mode.chips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestion?.(chip.text)}
                  className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl text-left transition-all duration-200"
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
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(124,58,237,0.15)" }}
                  >
                    <Icon size={12} sm:size={14} style={{ color: "#A78BFA" }} />
                  </div>
                  <span className="text-xs sm:text-sm leading-tight">
                    {chip.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════════ */
          /* CHAT MESSAGES — Shows when there are messages                     */
          /* ═════════════════════════════════════════════════════════════════ */
          <div className="max-w-3xl mx-auto w-full px-4 py-6">
            {messages.map((msg) => (
              <div key={msg.id}>
                <ChatMessage
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

                {/* Flashcard / Quiz */}
                {msg.role === "assistant" &&
                  !msg.isStreaming &&
                  !msg.isError &&
                  !msg.isStopped &&
                  msg.id === lastAiMsgId &&
                  msg.content.length > 100 && (
                    <div>
                      {activeStudy?.msgId === msg.id ? (
                        <div className="ml-11 mb-4">
                          <FlashcardQuiz
                            content={msg.content}
                            onClose={() => setActiveStudy(null)}
                            mode={activeStudy.mode}
                          />
                        </div>
                      ) : (
                        <StudyActions
                          onFlashcard={() =>
                            setActiveStudy({ msgId: msg.id, mode: "flashcard" })
                          }
                          onQuiz={() =>
                            setActiveStudy({ msgId: msg.id, mode: "quiz" })
                          }
                        />
                      )}
                    </div>
                  )}
              </div>
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

            <div ref={bottomRef} style={{ height: "20px" }} />
          </div>
        )}
      </div>

      {/* Jump to latest button */}
      {showScrollBtn && (
        <button
          onClick={() => {
            userScrolledUp.current = false;
            scrollToBottom("smooth");
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium z-20"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            color: "white",
            boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
            animation: "fadeInUp 0.2s ease",
          }}
        >
          <ArrowDown size={14} />
          Jump to latest
        </button>
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 40px rgba(124,58,237,0.35); }
          50% { box-shadow: 0 0 60px rgba(124,58,237,0.6); }
        }
        @keyframes fadeInUp {
          from { opacity:0; transform:translateX(-50%) translateY(8px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};