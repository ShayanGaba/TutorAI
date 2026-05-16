import { useMemo } from "react";
import type { AIMode } from "../../types";
import { MODES } from "../../types";
import { BookOpen, Code2, Brain, Lightbulb, Play } from "lucide-react";

interface WelcomeScreenProps {
  mode: AIMode;
  onSuggestion: (text: string) => void;
  onModeChange: (mode: AIMode) => void;
}

function getGreeting(): { emoji: string; text: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { emoji: "🌅", text: "Good morning" };
  if (hour >= 12 && hour < 17) return { emoji: "☀️", text: "Good afternoon" };
  if (hour >= 17 && hour < 21) return { emoji: "🌆", text: "Good evening" };
  return { emoji: "🌙", text: "Good night" };
}

const MODE_VISUALS: Record<
  AIMode,
  {
    gradient: string;
    glow: string;
    label: string;
    tagline: string;
    badge?: string;
    icon: React.FC<{ size: number; color?: string }>;
  }
> = {
  tutor: {
    gradient: "linear-gradient(135deg,#7C3AED,#6D28D9)",
    glow: "rgba(124,58,237,0.4)",
    label: "TutorAI",
    tagline: "Your patient, expert tutor for any subject — explained clearly.",
    badge: "MOST POPULAR",
    icon: BookOpen,
  },
  code: {
    gradient: "linear-gradient(135deg,#0EA5E9,#0284C7)",
    glow: "rgba(14,165,233,0.35)",
    label: "CodeAI",
    tagline: "Senior dev energy. Reviews, fixes, and explains your code.",
    icon: Code2,
  },
  think: {
    gradient: "linear-gradient(135deg,#F97316,#EA580C)",
    glow: "rgba(249,115,22,0.35)",
    label: "ThinkAI",
    tagline: "Structured analysis for complex problems and decisions.",
    icon: Brain,
  },
  creative: {
    gradient: "linear-gradient(135deg,#EC4899,#BE185D)",
    glow: "rgba(236,72,153,0.35)",
    label: "CreativeAI",
    tagline: "Your imaginative partner for writing, ideas, and content.",
    icon: Lightbulb,
  },
  youtube: {
    gradient: "linear-gradient(135deg,#EF4444,#DC2626)",
    glow: "rgba(239,68,68,0.35)",
    label: "YouTubeAI",
    tagline: "Paste any YouTube link — get instant summaries and insights.",
    icon: Play,
  },
};

const ALL_MODES: AIMode[] = ["tutor", "code", "think", "creative", "youtube"];

export function WelcomeScreen({
  mode,
  onSuggestion,
  onModeChange,
}: WelcomeScreenProps) {
  const greeting = useMemo(() => getGreeting(), []);
  const modeConfig = MODES[mode];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: "100%",
        padding: "32px 20px 40px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
        }}
      >
        {/* ── Vyse logo + greeting ── */}
        <div
          style={{
            textAlign: "center",
            animation: "fadeSlideDown 0.5s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              // gap: "10px",
              marginBottom: "14px",
            }}
          >
            <img
              src="/vyse-logo2.png"
              alt="Vyse"
              width={68}
              height={68}
              className="vyse-logo vyse-logo-thinking"
              style={{
                display: "block",
                filter: "drop-shadow(0 0 10px rgba(124,58,237,0.55))",
                objectFit: "contain",
                marginLeft: "-9px",
              }}
            />
            <span
              className="vyse-brand-text"
              style={{
                fontSize: "24.5px",
                // fontWeight: "800",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                // fontFamily: "'SF Pro Display', 'Segoe UI', sans-serif",
                marginLeft: "-10px",
                lineHeight: 1,
              }}
            >
              Vyse
            </span>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              margin: "0 0 6px",
            }}
          >
            {greeting.emoji} {greeting.text}
          </p>
          <h1
            style={{
              fontSize: "clamp(24px,5vw,36px)",
              fontWeight: "700",
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              margin: "0 0 6px",
              lineHeight: 1.15,
            }}
          >
            What would you like to do?
          </h1>
          <p
            style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}
          >
            Pick a mode to get started. Switch anytime.
          </p>
        </div>

        {/* ── Mode grid — auto-centering ── */}
        {/*
          Key fix: use a CSS trick — flex wrap with justify-content center.
          This naturally centers any number of cards including odd last rows.
          Each card has a fixed width so 3 fit on desktop, 2 on tablet, 1 on mobile.
          When there are 5 cards: row1 = 3, row2 = 2 (centered automatically).
        */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px",
            animation:
              "fadeSlideDown 0.55s cubic-bezier(0.22,1,0.36,1) 0.08s both",
            animationFillMode: "both",
          }}
        >
          {ALL_MODES.map((m, i) => {
            const v = MODE_VISUALS[m];
            const Icon = v.icon;
            const isActive = m === mode;
            return (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                style={{
                  // Fixed width — 3 per row on desktop, 2 on tablet, 1 on mobile
                  width: "clamp(200px, calc(33.333% - 10px), 220px)",
                  flexShrink: 0,
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  padding: "18px",
                  borderRadius: "20px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
                  background: isActive
                    ? "rgba(124,58,237,0.14)"
                    : "var(--glass-bg)",
                  border: isActive
                    ? "1px solid rgba(124,58,237,0.5)"
                    : "1px solid var(--border-default)",
                  boxShadow: isActive
                    ? `0 4px 24px ${v.glow}`
                    : "0 2px 8px rgba(0,0,0,0.06)",
                  animationDelay: `${i * 55}ms`,
                }}
                onMouseEnter={(e) => {
                  if (isActive) return;
                  const el = e.currentTarget;
                  el.style.background = "var(--glass-bg-hover)";
                  el.style.borderColor = "rgba(124,58,237,0.3)";
                  el.style.transform = "translateY(-3px)";
                  el.style.boxShadow = `0 10px 30px ${v.glow}`;
                }}
                onMouseLeave={(e) => {
                  if (isActive) return;
                  const el = e.currentTarget;
                  el.style.background = "var(--glass-bg)";
                  el.style.borderColor = "var(--border-default)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                }}
              >
                {v.badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      fontSize: "9px",
                      fontWeight: "700",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      background: "rgba(124,58,237,0.2)",
                      color: "#A78BFA",
                      padding: "3px 8px",
                      borderRadius: "20px",
                    }}
                  >
                    {v.badge}
                  </span>
                )}
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background: v.gradient,
                    boxShadow: `0 4px 14px ${v.glow}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <Icon size={20} color="white" />
                </div>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                    margin: "0 0 4px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {v.label}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {v.tagline}
                </p>
                <span
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    right: "16px",
                    fontSize: "16px",
                    color: "var(--text-muted)",
                    opacity: 0.4,
                    transition: "all 0.2s ease",
                  }}
                >
                  →
                </span>
              </button>
            );
          })}
        </div>

        {/* ── "Try asking" chips for active mode ── */}
        <div
          style={{
            width: "100%",
            animation:
              "fadeSlideDown 0.6s cubic-bezier(0.22,1,0.36,1) 0.25s both",
            animationFillMode: "both",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textAlign: "center",
              margin: "0 0 12px",
            }}
          >
            Try asking
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            {modeConfig.chips
              .slice(0, 4)
              .map((chip: { text: string }, i: number) => (
                <button
                  key={i}
                  onClick={() => onSuggestion(chip.text)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "rgba(124,58,237,0.4)";
                    el.style.color = "var(--text-primary)";
                    el.style.background = "var(--glass-bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "var(--border-default)";
                    el.style.color = "var(--text-secondary)";
                    el.style.background = "var(--glass-bg)";
                  }}
                >
                  {chip.text}
                </button>
              ))}
          </div>
        </div>

        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
          Powered by Groq · Built by Shayan
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity:0; transform:translateY(-14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @media (max-width: 600px) {
          /* On mobile, cards go full width */
          .mode-card { width: 100% !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
