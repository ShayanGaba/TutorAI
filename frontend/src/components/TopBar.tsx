import {
  Menu,
  Paperclip,
  Trash2,
  FileText,
  Image,
  X,
  Download,
} from "lucide-react";
import type { AIMode, ActiveFile, Message } from "../types";
import { MODES } from "../types";
import jsPDF from "jspdf";

interface TopBarProps {
  currentMode: AIMode;
  activeFile: ActiveFile | null;
  messages: Message[]; // ADD THIS
  onToggleSidebar: () => void;
  onOpenFileUpload: () => void;
  onClearChat: () => void;
  onRemoveFile: () => void;
}

export function TopBar({
  currentMode,
  activeFile,
  messages, // ADD THIS
  onToggleSidebar,
  onOpenFileUpload,
  onClearChat,
  onRemoveFile,
}: TopBarProps) {
  const mode = MODES[currentMode];
  const { Icon } = mode;

  const exportChat = () => {
    if (messages.length === 0) return;

    const pdf = new jsPDF();
    let y = 20;

    pdf.setFontSize(18);
    pdf.setTextColor(124, 58, 237);
    pdf.text("TutorAI Conversation", 20, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Exported on ${new Date().toLocaleDateString()}`, 20, y);
    y += 15;

    messages.forEach((msg) => {
      if (msg.isError) return;

      const role = msg.role === "user" ? "You" : "TutorAI";

      pdf.setFontSize(11);
      pdf.setTextColor(
        msg.role === "user" ? 124 : 167,
        msg.role === "user" ? 58 : 139,
        msg.role === "user" ? 237 : 250,
      );
      pdf.text(`${role}:`, 20, y);
      y += 7;

      pdf.setFontSize(10);
      pdf.setTextColor(200, 200, 200);

      const lines = pdf.splitTextToSize(msg.content || "", 170);

      // Check if we need a new page
      if (y + lines.length * 5 > 270) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(lines, 20, y);
      y += lines.length * 5 + 10;
    });

    pdf.save("tutorai-conversation.pdf");
  };

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
              className="ml-0.5 opacity-70 hover:opacity-100"
            >
              <X size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Export button — only shows when there are messages */}
        {messages.length > 0 && (
          <button
            onClick={exportChat}
            className="p-2 rounded-lg transition-all duration-200 hover:opacity-70"
            style={{
              color: "var(--text-secondary)",
              background: "var(--glass-bg)",
            }}
            title="Export chat as PDF"
          >
            <Download size={17} />
          </button>
        )}
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
