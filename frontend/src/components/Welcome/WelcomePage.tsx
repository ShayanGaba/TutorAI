import { useState, useEffect } from "react";
import type { AIMode } from "../../types";

interface WelcomePageProps {
  onSelectMode: (mode: AIMode) => void;
}

const MODES_CONFIG = [
  {
    id: "tutor" as AIMode,
    name: "TutorAI",
    label: "Learn anything",
    description:
      "Your patient, expert tutor for any subject — explained clearly.",
    icon: "🎓",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    glow: "rgba(99,102,241,0.35)",
    tag: "Most popular",
  },
  {
    id: "code" as AIMode,
    name: "CodeAI",
    label: "Build & debug",
    description: "Senior dev energy. Reviews, fixes, and explains your code.",
    icon: "⚡",
    gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    glow: "rgba(6,182,212,0.35)",
    tag: "",
  },
  {
    id: "think" as AIMode,
    name: "ThinkAI",
    label: "Deep reasoning",
    description: "Structured analysis for complex problems and decisions.",
    icon: "🧠",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    glow: "rgba(245,158,11,0.35)",
    tag: "",
  },
  {
    id: "creative" as AIMode,
    name: "CreativeAI",
    label: "Create & imagine",
    description: "Your imaginative partner for writing, ideas, and content.",
    icon: "✨",
    gradient: "linear-gradient(135deg, #ec4899, #f43f5e)",
    glow: "rgba(236,72,153,0.35)",
    tag: "",
  },
  {
    id: "youtube" as AIMode,
    name: "YouTubeAI",
    label: "Analyze videos",
    description: "Paste any YouTube link — get instant summaries and insights.",
    icon: "▶",
    gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
    glow: "rgba(239,68,68,0.35)",
    tag: "",
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

export function WelcomePage({ onSelectMode }: WelcomePageProps) {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const [greeting] = useState(getGreeting());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px 40px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        overflowY: "auto",
      }}
    >
      {/* ── Logo + wordmark ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
          animation: "slideDown 0.6s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #7C3AED, #4C1D95)",
            boxShadow: "0 0 28px rgba(124,58,237,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            fontWeight: "700",
            color: "white",
            letterSpacing: "-0.03em",
            fontFamily: "'SF Pro Display', 'Segoe UI', sans-serif",
          }}
        >
          V
        </div>
        <span
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "var(--text-primary)",
            letterSpacing: "-0.04em",
            fontFamily: "'SF Pro Display', 'Segoe UI', sans-serif",
          }}
        >
          Vyse
        </span>
      </div>

      {/* ── Greeting ── */}
      <p
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          margin: "0 0 6px",
          animation: "slideDown 0.65s cubic-bezier(0.22,1,0.36,1) 0.05s both",
        }}
      >
        {greeting} 👋
      </p>

      {/* ── Headline ── */}
      <h1
        style={{
          fontSize: "clamp(26px, 5vw, 38px)",
          fontWeight: "700",
          color: "var(--text-primary)",
          textAlign: "center",
          letterSpacing: "-0.04em",
          margin: "0 0 8px",
          lineHeight: 1.15,
          fontFamily: "'SF Pro Display', 'Segoe UI', sans-serif",
          animation: "slideDown 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both",
        }}
      >
        What would you like to do?
      </h1>

      <p
        style={{
          fontSize: "15px",
          color: "var(--text-secondary)",
          textAlign: "center",
          margin: "0 0 36px",
          maxWidth: "400px",
          animation: "slideDown 0.75s cubic-bezier(0.22,1,0.36,1) 0.15s both",
        }}
      >
        Pick a mode to get started. Switch anytime.
      </p>

      {/* ── Mode cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "10px",
          width: "100%",
          maxWidth: "820px",
        }}
      >
        {MODES_CONFIG.map((mode, i) => (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            onMouseEnter={() => setHoveredMode(mode.id)}
            onMouseLeave={() => setHoveredMode(null)}
            style={{
              background:
                hoveredMode === mode.id
                  ? "var(--glass-bg-hover)"
                  : "var(--glass-bg)",
              border: `1px solid ${hoveredMode === mode.id ? "rgba(124,58,237,0.4)" : "var(--border-default)"}`,
              borderRadius: "16px",
              padding: "18px 20px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
              transform: hoveredMode === mode.id ? "translateY(-2px)" : "none",
              boxShadow:
                hoveredMode === mode.id ? `0 8px 32px ${mode.glow}` : "none",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              animation: `slideDown 0.7s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.06}s both`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* glow accent line on left when hovered */}
            {hoveredMode === mode.id && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "20%",
                  bottom: "20%",
                  width: "3px",
                  borderRadius: "0 4px 4px 0",
                  background: mode.gradient,
                }}
              />
            )}

            {/* Icon */}
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: mode.gradient,
                boxShadow:
                  hoveredMode === mode.id ? `0 4px 16px ${mode.glow}` : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: mode.id === "youtube" ? "16px" : "20px",
                flexShrink: 0,
                transition: "box-shadow 0.2s ease",
                color: "white",
                fontWeight: "700",
              }}
            >
              {mode.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "3px",
                }}
              >
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontFamily: "'SF Pro Display', 'Segoe UI', sans-serif",
                  }}
                >
                  {mode.name}
                </span>
                {mode.tag && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "600",
                      background: "rgba(124,58,237,0.15)",
                      color: "#A78BFA",
                      padding: "2px 7px",
                      borderRadius: "20px",
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                    }}
                  >
                    {mode.tag}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#A78BFA",
                  margin: "0 0 4px",
                }}
              >
                {mode.label}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {mode.description}
              </p>
            </div>

            {/* Arrow */}
            <div
              style={{
                color:
                  hoveredMode === mode.id ? "#A78BFA" : "var(--text-muted)",
                fontSize: "18px",
                flexShrink: 0,
                alignSelf: "center",
                transition: "all 0.2s ease",
                transform: hoveredMode === mode.id ? "translateX(2px)" : "none",
              }}
            >
              →
            </div>
          </button>
        ))}
      </div>

      {/* ── Footer ── */}
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          marginTop: "32px",
          animation: "slideDown 0.8s cubic-bezier(0.22,1,0.36,1) 0.5s both",
        }}
      >
        Powered by Groq · Built by Shayan
      </p>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
