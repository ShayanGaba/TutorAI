import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { FlashcardQuiz } from "./FlashcardQuiz";
import { Zap, ArrowDown } from "lucide-react";
import type { Message, AIMode } from "../../types";
import { MODES } from "../../types";
import type {
  FlashcardData,
  QuizQuestion,
} from "../../utils/generateFlashcards";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  isThinking: boolean;
  currentMode: AIMode;
  onSuggestion?: (text: string) => void;
  onFeedback?: (id: string, type: "up" | "down") => void;
  onGenerate: (
    content: string,
    type: "flashcard" | "quiz",
  ) => Promise<FlashcardData[] | QuizQuestion[]>;
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
  onGenerate,
  onRegenerate,
  onRetry,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const userScrolledUp = useRef(false);
  const isAutoScrolling = useRef(false);

  const mode = MODES[currentMode];
  const { Icon } = mode;

  const getDistanceFromBottom = useCallback(() => {
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
    }, 300);
  }, []);

  const handleScroll = useCallback(() => {
    const near = getDistanceFromBottom() < 80;
    setShowScrollBtn(!near);
    if (!isAutoScrolling.current) userScrolledUp.current = !near;
  }, [getDistanceFromBottom]);

  useEffect(() => {
    if (!userScrolledUp.current) scrollToBottom("smooth");
  }, [messages, isThinking, scrollToBottom]);

  const prevCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevCount.current) {
      const last = messages[messages.length - 1];
      if (last?.role === "user") {
        userScrolledUp.current = false;
        scrollToBottom("smooth");
      }
    }
    prevCount.current = messages.length;
  }, [messages, scrollToBottom]);

  const shouldShowFlashcard = (msg: Message) =>
    msg.role === "assistant" &&
    !msg.isStreaming &&
    !msg.isError &&
    !msg.isStopped &&
    msg.content.length > 120;

  return (
    <div className="flex-1 overflow-hidden relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden"
        style={{
          padding: "16px 12px",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full py-8 sm:py-12 px-4">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-6"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #4C1D95)",
                boxShadow: "0 0 40px rgba(124,58,237,0.35)",
                animation: "pulse-glow 3s ease-in-out infinite",
              }}
            >
              <Zap size={24} color="white" fill="white" />
            </div>
            <h1
              className="font-bold text-center mb-2 text-xl sm:text-[28px]"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
            >
              Hello, I'm {mode.name} 👋
            </h1>
            <p
              className="text-center mb-6 sm:mb-10 text-sm sm:text-base px-4"
              style={{ color: "var(--text-secondary)", maxWidth: "400px" }}
            >
              {mode.subtitle}
            </p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full px-2"
              style={{ maxWidth: "600px" }}
            >
              {mode.chips.map((chip: { text: string }, i: number) => (
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
                    <Icon size={14} style={{ color: "#A78BFA" }} />
                  </div>
                  <span className="text-xs sm:text-sm leading-tight">
                    {chip.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full pb-4">
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
                {shouldShowFlashcard(msg) && (
                  <div className="px-2 mb-4">
                    <FlashcardQuiz
                      messageContent={msg.content}
                      onGenerate={onGenerate}
                    />
                  </div>
                )}
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start mb-4 px-2">
                <ThinkingIndicator />
              </div>
            )}
            <div ref={bottomRef} style={{ height: "80px" }} />
          </div>
        )}
      </div>

      {showScrollBtn && (
        <button
          onClick={() => {
            userScrolledUp.current = false;
            scrollToBottom("smooth");
            setShowScrollBtn(false);
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium z-20"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            color: "white",
            boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
            animation: "fadeInUp 0.2s ease",
          }}
        >
          <ArrowDown size={14} /> Scroll to bottom
        </button>
      )}

      <style>{`
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 40px rgba(124,58,237,0.35)}50%{box-shadow:0 0 60px rgba(124,58,237,0.6)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>
    </div>
  );
};
