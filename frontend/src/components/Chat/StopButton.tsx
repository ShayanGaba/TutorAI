import { Square } from "lucide-react";

interface StopButtonProps {
  onStop: () => void;
}

export function StopButton({ onStop }: StopButtonProps) {
  return (
    <div className="flex justify-center mb-3">
      <button
        onClick={onStop}
        className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(124,58,237,0.4)",
          color: "var(--text-secondary)",
          fontSize: "13px",
          fontFamily: "'Inter', sans-serif",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.background = "rgba(124,58,237,0.1)";
          el.style.borderColor = "rgba(124,58,237,0.7)";
          el.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.background = "rgba(255,255,255,0.04)";
          el.style.borderColor = "rgba(124,58,237,0.4)";
          el.style.color = "var(--text-secondary)";
        }}
      >
        <Square size={13} fill="currentColor" />
        Stop generating
      </button>
    </div>
  );
}
