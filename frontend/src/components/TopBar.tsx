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
  Globe,
} from "lucide-react";
import type { AIMode, ActiveFile, Message, Language } from "../types";
import { LANGUAGES, MODES } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { LanguageSelector } from "./UI/LanguageSelector";
import jsPDF from "jspdf";
import { useState } from "react";

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
  const [showLangDropdown, setShowLangDropdown] = useState(false);

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
      className="flex items-center justify-between px-2 sm:px-3 py-2 flex-shrink-0"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(var(--bg-base-rgb, 10,10,15),0.8)",
        borderBottom: "1px solid var(--border-subtle)",
        zIndex: 10,
        minHeight: "48px",
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg transition-colors hover:opacity-70 md:hidden"
          style={{
            color: "var(--text-secondary)",
            background: "var(--glass-bg)",
          }}
        >
          <Menu size={16} />
        </button>
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(124,58,237,0.2)" }}
        >
          <Icon size={12} style={{ color: "#A78BFA" }} />
        </div>
        <span
          className="font-semibold text-sm hidden sm:block"
          style={{ color: "var(--text-primary)" }}
        >
          {mode.name}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-mono hidden md:block"
          style={{
            background: "var(--glass-bg)",
            color: "var(--text-muted)",
            border: "1px solid var(--border-subtle)",
            fontSize: "10px",
          }}
        >
          llama-3.3-70b
        </span>
      </div>

      {/* Center */}
      <div className="flex-1 min-w-0 mx-2 hidden sm:flex items-center justify-center">
        {activeFile && (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs max-w-[200px]"
            style={{
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "var(--accent-primary)",
            }}
          >
            {activeFile.type === "pdf" ? (
              <FileText size={10} />
            ) : (
              <Image size={10} />
            )}
            <span className="truncate">{activeFile.name}</span>
            <button
              onClick={onRemoveFile}
              className="opacity-70 hover:opacity-100"
            >
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {/* Language */}
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
            style={{
              color: "var(--text-muted)",
              background: "var(--glass-bg)",
            }}
          >
            <Globe size={12} />
            <span className="hidden sm:inline">{language}</span>
            <span className="sm:hidden">{language.slice(0, 2)}</span>
          </button>

          {/* Dropdown */}
          {showLangDropdown && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg py-1 min-w-[120px] z-50"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    onLanguageChange(lang);
                    setShowLangDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:opacity-80"
                  style={{
                    color:
                      language === lang
                        ? "var(--accent-primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <button
          onClick={onToggleShortcuts}
          className="p-1.5 sm:p-2 rounded-lg hover:opacity-70 transition-all hidden md:flex"
          style={{
            color: "var(--text-secondary)",
            background: "var(--glass-bg)",
          }}
          title="Keyboard shortcuts (Ctrl+/)"
        >
          <Keyboard size={14} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-lg hover:opacity-70 transition-all"
          style={{
            color: "var(--text-secondary)",
            background: "var(--glass-bg)",
          }}
          title="Toggle theme (Ctrl+L)"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Export */}
        {messages.length > 0 && (
          <button
            onClick={exportChat}
            className="p-1.5 sm:p-2 rounded-lg hover:opacity-70 transition-all"
            style={{
              color: "var(--text-secondary)",
              background: "var(--glass-bg)",
            }}
            title="Export as PDF"
          >
            <Download size={14} />
          </button>
        )}

        {/* Attach */}
        <button
          onClick={onOpenFileUpload}
          className="p-1.5 sm:p-2 rounded-lg hover:opacity-70 transition-all"
          style={{
            color: "var(--text-secondary)",
            background: "var(--glass-bg)",
          }}
          title="Attach file"
        >
          <Paperclip size={14} />
        </button>

        {/* Clear */}
        <button
          onClick={onClearChat}
          className="p-1.5 sm:p-2 rounded-lg hover:opacity-70 transition-all"
          style={{
            color: "var(--text-secondary)",
            background: "var(--glass-bg)",
          }}
          title="Clear chat"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </header>
  );
}
