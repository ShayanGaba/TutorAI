import { Menu, Paperclip, Trash2, FileText, Image, X } from "lucide-react";
import type { AIMode, ActiveFile } from "../types";
import { MODES } from "../types";

interface TopBarProps {
  currentMode: AIMode;
  activeFile: ActiveFile | null;
  onToggleSidebar: () => void;
  onOpenFileUpload: () => void;
  onClearChat: () => void;
  onRemoveFile: () => void;
}

export function TopBar({
  currentMode,
  activeFile,
  onToggleSidebar,
  onOpenFileUpload,
  onClearChat,
  onRemoveFile,
}: TopBarProps) {
  const mode = MODES[currentMode];
  const { Icon } = mode;

  return (
    <header
      className="flex items-center justify-between px-4 py-3 flex-shrink-0"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(10,10,15,0.8)",
        borderBottom: "1px solid var(--border-subtle)",
        zIndex: 10,
      }}
    >
      {/* Left: hamburger (mobile) */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden p-2 rounded-lg transition-colors hover:opacity-70"
        style={{
          color: "var(--text-secondary)",
          background: "var(--glass-bg)",
        }}
      >
        <Menu size={18} />
      </button>

      {/* Center: mode + model badge */}
      <div className="flex items-center gap-3 flex-1 justify-center md:justify-start">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(124,58,237,0.2)" }}
          >
            <Icon size={13} style={{ color: "#A78BFA" }} />
          </div>
          <span
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {mode.name}
          </span>
        </div>

        <span
          className="text-xs px-2.5 py-1 rounded-full font-mono font-medium"
          style={{
            background: "var(--glass-bg)",
            color: "var(--text-muted)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          llama-3.3-70b
        </span>

        {/* Active file badge */}
        {activeFile && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "var(--accent-primary)",
            }}
          >
            {activeFile.type === "pdf" ? (
              <FileText size={11} />
            ) : (
              <Image size={11} />
            )}
            <span className="max-w-[100px] truncate">{activeFile.name}</span>
            <button
              onClick={onRemoveFile}
              className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenFileUpload}
          className="p-2 rounded-lg transition-all duration-200 hover:opacity-70"
          style={{
            color: "var(--text-secondary)",
            background: "var(--glass-bg)",
          }}
          title="Attach file"
        >
          <Paperclip size={17} />
        </button>
        <button
          onClick={onClearChat}
          className="p-2 rounded-lg transition-all duration-200 hover:opacity-70"
          style={{
            color: "var(--text-secondary)",
            background: "var(--glass-bg)",
          }}
          title="Clear chat"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </header>
  );
}
