import { useState } from "react";
import { Plus, Settings, Zap, Trash2, Info } from "lucide-react";
import type { AIMode, ChatHistoryItem } from "../../types";
import { ModeSelector } from "./ModeSelector";
import { ChatHistory } from "./ChatHistory";
import "../../index.css";

interface SidebarProps {
  isOpen: boolean;
  currentMode: AIMode;
  history: ChatHistoryItem[];
  deletingIds: Set<string>;
  isLoading?: boolean; // ← ADD THIS
  onNewChat: () => void;
  onModeChange: (mode: AIMode) => void;
  onSelectHistory: (item: ChatHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
  onClose?: () => void;
}

export function Sidebar({
  isOpen,
  currentMode,
  history,
  deletingIds,
  isLoading = false, // ← ADD THIS (default false so it's safe if not passed)
  onNewChat,
  onModeChange,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
  onClose,
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);


    console.log("Sidebar isLoading:", isLoading);

  return (
    <aside
      className="flex flex-col h-full sidebar-transition overflow-hidden"
      style={{
        width: isOpen ? "260px" : "0px",
        minWidth: isOpen ? "260px" : "0px",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{
          width: "260px",
          opacity: isOpen ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "12px",
              animation: "slideDown 0.6s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <img
              src="/vyse-logo2.png"
              alt="Vyse"
              width={64}
              height={64}
              className={`vyse-logo ${isLoading ? "vyse-logo-thinking" : ""}`}
              style={{
                display: "block",
                objectFit: "contain",
                marginLeft: "-4px",
              }}
            />
            <span
              className="vyse-brand-text"
              style={{
                fontSize: "23px",
                color: "var(--text-primary)",
                marginLeft: "-8px",
                lineHeight: 1,
              }}
            >
              Vyse
            </span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              onClose?.();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-semibold text-sm text-white transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
              boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 20px rgba(124,58,237,0.5)";
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1.01)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 12px rgba(124,58,237,0.3)";
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1)";
            }}
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        {/* Mode Selector */}
        <div
          className="flex-shrink-0 pb-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <ModeSelector currentMode={currentMode} onModeChange={onModeChange} />
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
          <ChatHistory
            history={history}
            deletingIds={deletingIds}
            onSelect={(item) => {
              onSelectHistory(item);
              onClose?.();
            }}
            onDelete={onDeleteHistory}
          />
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 flex-shrink-0 relative"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                }}
              >
                V
              </div>
              <div>
                <div
                  className="text-xs font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Vyse
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  v2.0
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSettings((p) => !p)}
              className="p-1.5 rounded-lg transition-all duration-200 hover:opacity-70"
              style={{
                color: "var(--text-muted)",
                background: showSettings ? "var(--glass-bg)" : "transparent",
              }}
            >
              <Settings size={15} />
            </button>
          </div>

          {/* Settings Popover */}
          {showSettings && (
            <div
              className="absolute bottom-14 right-4 rounded-xl p-3 flex flex-col gap-1 min-w-[180px] animate-scale-in"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                zIndex: 10,
              }}
            >
              {showClearConfirm ? (
                <div className="flex flex-col gap-2">
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Clear all history?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onClearHistory();
                        setShowClearConfirm(false);
                        setShowSettings(false);
                      }}
                      className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                      style={{ background: "var(--error)", color: "white" }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                      style={{
                        background: "var(--glass-bg)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors hover:opacity-80"
                    style={{
                      color: "var(--error)",
                      background: "rgba(239,68,68,0.08)",
                    }}
                  >
                    <Trash2 size={13} />
                    Clear all history
                  </button>
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Info size={13} />
                    About Vyse v2.0
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
