import {
  Menu,
  Paperclip,
  Trash2,
  FileText,
  Image,
  X,
  Download,
  Sun,
  Moon,
  Keyboard,
} from "lucide-react";
import type { AIMode, ActiveFile, Message, Language } from "../types";
import { MODES } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { LanguageSelector } from "./UI/LanguageSelector";
import jsPDF from "jspdf";

interface TopBarProps {
  currentMode: AIMode;
  activeFile: ActiveFile | null;
  messages: Message[];
  language: Language;
  onToggleSidebar: () => void;
  onOpenFileUpload: () => void;
  onClearChat: () => void;
  onRemoveFile: () => void;
  onToggleShortcuts: () => void;
  onLanguageChange: (lang: Language) => void;
}

export function TopBar({
  currentMode,
  activeFile,
  messages,
  language,
  onToggleSidebar,
  onOpenFileUpload,
  onClearChat,
  onRemoveFile,
  onToggleShortcuts,
  onLanguageChange,
}: TopBarProps) {
  const mode = MODES[currentMode];
  const { Icon } = mode;
  const { theme, toggleTheme } = useTheme();

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
      pdf.setTextColor(100, 100, 100);
      const lines = pdf.splitTextToSize(msg.content || "", 170);
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
      className="flex items-center justify-between px-3 py-2.5 flex-shrink-0"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(var(--bg-base-rgb, 10,10,15),0.8)",
        borderBottom: "1px solid var(--border-subtle)",
        zIndex: 10,
        minHeight: "52px",
      }}
    >
      {/* Left */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg transition-colors hover:opacity-70 md:hidden"
        style={{
          color: "var(--text-secondary)",
          background: "var(--glass-bg)",
        }}
      >
        <Menu size={18} />
      </button>

      {/* Center */}
      <div className="flex items-center gap-2 flex-1 justify-center md:justify-start md:ml-0 ml-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(124,58,237,0.2)" }}
        >
          <Icon size={13} style={{ color: "#A78BFA" }} />
        </div>
        <span
          className="font-semibold text-sm hidden sm:block"
          style={{ color: "var(--text-primary)" }}
        >
          {mode.name}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-mono hidden md:block"
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
            className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs"
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
            <span className="max-w-[80px] truncate">{activeFile.name}</span>
            <button
              onClick={onRemoveFile}
              className="ml-0.5 opacity-70 hover:opacity-100"
            >
              <X size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Language */}
        <div className="hidden md:block">
          <LanguageSelector value={language} onChange={onLanguageChange} />
        </div>

        {/* Shortcuts */}
        <button
          onClick={onToggleShortcuts}
          className="p-2 rounded-lg hover:opacity-70 transition-all hidden md:flex"
          style={{
            color: "var(--text-secondary)",
            background: "var(--glass-bg)",
          }}
          title="Keyboard shortcuts (Ctrl+/)"
        >
          <Keyboard size={16} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:opacity-70 transition-all"
          style={{
            color: "var(--text-secondary)",
            background: "var(--glass-bg)",
          }}
          title="Toggle theme (Ctrl+L)"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Export */}
        {messages.length > 0 && (
          <button
            onClick={exportChat}
            className="p-2 rounded-lg hover:opacity-70 transition-all"
            style={{
              color: "var(--text-secondary)",
              background: "var(--glass-bg)",
            }}
            title="Export as PDF"
          >
            <Download size={16} />
          </button>
        )}

        {/* Attach */}
        <button
          onClick={onOpenFileUpload}
          className="p-2 rounded-lg hover:opacity-70 transition-all"
          style={{
            color: "var(--text-secondary)",
            background: "var(--glass-bg)",
          }}
          title="Attach file"
        >
          <Paperclip size={16} />
        </button>

        {/* Clear */}
        <button
          onClick={onClearChat}
          className="p-2 rounded-lg hover:opacity-70 transition-all"
          style={{
            color: "var(--text-secondary)",
            background: "var(--glass-bg)",
          }}
          title="Clear chat"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </header>
  );
}
