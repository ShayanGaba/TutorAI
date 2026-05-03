import { X, Command } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Enter"], desc: "Send message" },
  { keys: ["Shift", "Enter"], desc: "New line" },
  { keys: ["Ctrl", "K"], desc: "Clear chat" },
  { keys: ["Ctrl", "/"], desc: "Toggle shortcuts" },
  { keys: ["Ctrl", "L"], desc: "Toggle light/dark mode" },
  { keys: ["Ctrl", "1"], desc: "Switch to TutorAI" },
  { keys: ["Ctrl", "2"], desc: "Switch to CodeAI" },
  { keys: ["Ctrl", "3"], desc: "Switch to ThinkAI" },
  { keys: ["Ctrl", "4"], desc: "Switch to CreativeAI" },
  { keys: ["Ctrl", "5"], desc: "Switch to YouTubeAI" },
  { keys: ["Esc"], desc: "Stop generation" },
];

export function KeyboardShortcuts({ isOpen, onClose }: Props) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 animate-scale-in"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Command size={18} style={{ color: "var(--accent-primary)" }} />
            <h2
              className="font-bold text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Keyboard Shortcuts
            </h2>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span
                style={{ color: "var(--text-secondary)", fontSize: "13px" }}
              >
                {s.desc}
              </span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold"
                    style={{
                      background: "var(--glass-bg)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p
          className="mt-4 text-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Press Ctrl+/ anytime to open this panel
        </p>
      </div>
    </div>
  );
}
