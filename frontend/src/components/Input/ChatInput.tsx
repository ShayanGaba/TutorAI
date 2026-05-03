import { useRef, useCallback, useEffect } from "react";
import { ArrowUp, Paperclip, Mic, MicOff, X } from "lucide-react";
import type { AIMode, ActiveFile } from "../../types";
import { MODES } from "../../types";
import { FilePreviewBar } from "./FilePreviewBar";
import { useVoice } from "../../hooks/useVoice";
import { TokenCounter } from "../UI/TokenCounter";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  currentMode: AIMode;
  isLoading: boolean;
  isStreaming: boolean;
  activeFile: ActiveFile | null;
  pendingImage: string | null;
  pendingImageName?: string;
  onOpenFileUpload: () => void;
  onRemoveFile: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  currentMode,
  isLoading,
  isStreaming,
  activeFile,
  pendingImage,
  pendingImageName,
  onOpenFileUpload,
  onRemoveFile,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const disabled = isLoading || isStreaming;
  const canSend = (value.trim().length > 0 || !!pendingImage) && !disabled;

  const { isListening, isSupported, startListening, stopListening } = useVoice(
    (transcript) => onChange(transcript),
  );

  const handleVoiceToggle = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);
  useEffect(() => {
    if (!isListening) textareaRef.current?.focus();
  }, [isListening]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (canSend) {
          if (isListening) stopListening();
          onSend();
        }
      }
    },
    [canSend, onSend, isListening, stopListening],
  );

  return (
    <div
      className="flex-shrink-0 px-3 sm:px-4 pb-4 pt-2"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="max-w-3xl mx-auto w-full">
        {activeFile && (
          <FilePreviewBar activeFile={activeFile} onRemove={onRemoveFile} />
        )}

        {/* Pending image preview — VISIBLE before sending */}
        {pendingImage && (
          <div
            className="flex items-center gap-3 mb-2 p-2 rounded-xl animate-fade-in-up"
            style={{
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.25)",
            }}
          >
            <img
              src={pendingImage}
              alt="Preview"
              className="rounded-lg object-cover flex-shrink-0"
              style={{ width: "48px", height: "48px" }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {pendingImageName || "Image ready to send"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Click send to attach to your message
              </p>
            </div>
            <button
              onClick={onRemoveFile}
              className="p-1 rounded-lg hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Voice indicator */}
        {isListening && (
          <div
            className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#EF4444",
                animation: "voicePulse 1s ease-in-out infinite",
              }}
            />
            <span style={{ color: "#FCA5A5", fontSize: "13px" }}>
              Listening... speak now. Click mic to stop.
            </span>
          </div>
        )}

        {/* Input box */}
        <div
          className="flex items-end gap-2 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3"
          style={{
            background: "var(--glass-bg)",
            border: `1px solid ${isListening ? "rgba(239,68,68,0.35)" : "var(--border-default)"}`,
            transition: "border-color 0.2s",
          }}
        >
          <button
            onClick={onOpenFileUpload}
            disabled={disabled}
            className="flex-shrink-0 p-1.5 rounded-lg transition-all self-end mb-0.5 hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
            title="Attach file or image"
          >
            <Paperclip size={17} />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              isListening ? "Listening..." : MODES[currentMode].placeholder
            }
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none leading-relaxed"
            style={{
              color: "var(--text-primary)",
              caretColor: "var(--accent-primary)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "15px",
              minHeight: "24px",
              maxHeight: "144px",
              overflowY: "auto",
            }}
          />

          {isSupported && (
            <button
              onClick={handleVoiceToggle}
              disabled={disabled}
              className="flex-shrink-0 p-1.5 rounded-lg transition-all self-end mb-0.5"
              style={{
                color: isListening ? "#EF4444" : "var(--text-muted)",
                background: isListening ? "rgba(239,68,68,0.1)" : "transparent",
                border: isListening
                  ? "1px solid rgba(239,68,68,0.3)"
                  : "1px solid transparent",
              }}
              title={isListening ? "Stop" : "Voice input"}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
          )}

          <button
            onClick={() => {
              if (isListening) stopListening();
              onSend();
            }}
            disabled={!canSend}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all self-end"
            style={{
              background: canSend
                ? "linear-gradient(135deg, #7C3AED, #6D28D9)"
                : "var(--glass-bg)",
              opacity: canSend ? 1 : 0.4,
              boxShadow: canSend ? "0 4px 12px rgba(124,58,237,0.35)" : "none",
              border: canSend ? "none" : "1px solid var(--border-default)",
              cursor: canSend ? "pointer" : "not-allowed",
            }}
          >
            <ArrowUp size={16} color="white" />
          </button>
        </div>

        {/* Bottom row: token counter + hint */}
        <div className="flex items-center justify-between mt-1.5 px-1">
          <TokenCounter text={value} />
          <p style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        @keyframes voicePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
