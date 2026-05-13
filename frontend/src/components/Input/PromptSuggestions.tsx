import { useEffect, useState, useRef } from "react";
import type { AIMode } from "../../types";

interface PromptSuggestionsProps {
  inputValue: string;
  currentMode: AIMode;
  isLoading: boolean;
  isStreaming: boolean;
  hasMessages: boolean;
  onSelect: (text: string) => void;
}

// ── Static chips per mode (shown when input is empty) ──────────────────────
const MODE_DEFAULTS: Record<AIMode, string[]> = {
  tutor: [
    "Explain quantum entanglement simply",
    "How does the human immune system work?",
    "What is the difference between ML and AI?",
    "Break down the French Revolution",
    "Explain compound interest with examples",
    "What is photosynthesis step by step?",
  ],
  code: [
    "Review my code for bugs",
    "Explain async/await in JavaScript",
    "How do I center a div in CSS?",
    "What is Big O notation?",
    "Write a Python function to sort a list",
    "Explain REST vs GraphQL",
  ],
  think: [
    "Pros and cons of remote work",
    "Should I learn React or Vue in 2026?",
    "Analyze the impact of AI on jobs",
    "Is social media net positive or negative?",
    "How to make better decisions under pressure",
    "Evaluate startup idea: AI note-taker app",
  ],
  creative: [
    "Write an opening line for a thriller novel",
    "Give me 5 startup name ideas for a fitness app",
    "Write a poem about the night sky",
    "Brainstorm a viral marketing campaign",
    "Write a product description for luxury headphones",
    "Give me a creative metaphor for learning",
  ],
  youtube: [
    "Paste a YouTube link to analyze it",
    "Summarize this video for me",
    "What are the key points from this lecture?",
    "Give me timestamps for the main topics",
  ],
};

// ── Dynamic chips based on what user is typing ────────────────────────────
function getDynamicSuggestions(input: string, mode: AIMode): string[] {
  const lower = input.toLowerCase().trim();
  if (!lower || lower.length < 3) return [];

  const suggestions: string[] = [];

  // Universal patterns
  if (lower.startsWith("what is") || lower.startsWith("what's")) {
    const topic = input.replace(/what(?:'s| is)\s*/i, "").trim();
    if (topic) {
      suggestions.push(
        `Explain ${topic} with a real example`,
        `What is ${topic} in simple terms?`,
        `What is ${topic} used for in practice?`,
      );
    }
  } else if (lower.startsWith("how")) {
    suggestions.push(
      `${input} — step by step`,
      `${input} — give me a beginner explanation`,
    );
  } else if (lower.startsWith("why")) {
    suggestions.push(
      `${input} — with historical context`,
      `${input} — in simple words`,
    );
  } else if (
    lower.includes("code") ||
    lower.includes("function") ||
    lower.includes("bug")
  ) {
    suggestions.push(
      `${input} — with a working example`,
      `Explain the best approach for: ${input}`,
    );
  } else if (lower.includes("explain") || lower.includes("tell me")) {
    suggestions.push(`${input} like I'm 15`, `${input} — with examples`);
  } else if (input.length > 10) {
    // Generic expansions
    if (mode === "tutor") {
      suggestions.push(
        `${input} — give me a summary`,
        `${input} — quiz me on this after`,
      );
    } else if (mode === "code") {
      suggestions.push(
        `${input} — show me working code`,
        `${input} — what are common mistakes?`,
      );
    } else if (mode === "think") {
      suggestions.push(
        `${input} — analyze pros and cons`,
        `${input} — what would experts say?`,
      );
    } else if (mode === "creative") {
      suggestions.push(
        `${input} — give me 3 variations`,
        `${input} — make it more interesting`,
      );
    }
  }

  return suggestions.slice(0, 3);
}

export function PromptSuggestions({
  inputValue,
  currentMode,
  isLoading,
  isStreaming,
  hasMessages,
  onSelect,
}: PromptSuggestionsProps) {
  const [chips, setChips] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevModeRef = useRef(currentMode);

  useEffect(() => {
    if (isLoading || isStreaming) {
      setVisible(false);
      return;
    }

    // Clear on mode change
    if (prevModeRef.current !== currentMode) {
      prevModeRef.current = currentMode;
      setChips([]);
      setVisible(false);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const trimmed = inputValue.trim();

      if (!trimmed) {
        // Show mode defaults only on empty chat (welcome feel)
        if (!hasMessages) {
          const defaults = MODE_DEFAULTS[currentMode];
          // Pick 3 random ones
          const shuffled = [...defaults]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          setChips(shuffled);
          setVisible(true);
        } else {
          setVisible(false);
          setChips([]);
        }
        return;
      }

      const dynamic = getDynamicSuggestions(trimmed, currentMode);
      if (dynamic.length > 0) {
        setChips(dynamic);
        setVisible(true);
      } else {
        setVisible(false);
        setChips([]);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, currentMode, isLoading, isStreaming, hasMessages]);

  if (!visible || chips.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        paddingBottom: "8px",
        animation: "fadeSlideUp 0.2s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {chips.map((chip, i) => (
        <button
          key={`${chip}-${i}`}
          onClick={() => onSelect(chip)}
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--border-default)",
            borderRadius: "20px",
            padding: "6px 14px",
            fontSize: "12px",
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
            maxWidth: "280px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = "rgba(124,58,237,0.1)";
            el.style.borderColor = "rgba(124,58,237,0.35)";
            el.style.color = "#A78BFA";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = "var(--glass-bg)";
            el.style.borderColor = "var(--border-default)";
            el.style.color = "var(--text-secondary)";
          }}
          title={chip}
        >
          ✦ {chip}
        </button>
      ))}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
