import { useState, useCallback } from "react";

interface FlashcardQuizProps {
  messageContent: string;
  onGenerate: (
    content: string,
    type: "flashcard" | "quiz",
  ) => Promise<FlashcardData[] | QuizQuestion[]>;
}

export interface FlashcardData {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

type Mode = "idle" | "loading" | "flashcard" | "quiz";

// ── Parse raw AI text into structured data ──────────────────────────────────
function parseFlashcards(raw: string): FlashcardData[] {
  const cards: FlashcardData[] = [];
  // Match patterns like: Q: ... A: ... or Front: ... Back: ... or numbered
  const blocks = raw.split(/\n{2,}|\d+\.\s+/).filter(Boolean);

  for (const block of blocks) {
    const qMatch = block.match(
      /(?:Q|Front|Term|Question)[:\-]\s*(.+?)(?:\n)/is,
    );
    const aMatch = block.match(/(?:A|Back|Definition|Answer)[:\-]\s*(.+)/is);
    if (qMatch && aMatch) {
      cards.push({
        front: qMatch[1].trim(),
        back: aMatch[1].trim(),
      });
    }
  }

  // fallback: try JSON
  if (cards.length === 0) {
    try {
      const json = JSON.parse(raw.trim().replace(/```json|```/g, ""));
      if (Array.isArray(json)) {
        for (const item of json) {
          if (item.front && item.back)
            cards.push({ front: item.front, back: item.back });
          else if (item.question && item.answer)
            cards.push({ front: item.question, back: item.answer });
        }
      }
    } catch {}
  }

  return cards.slice(0, 10);
}

function parseQuiz(raw: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Try JSON first
  try {
    const json = JSON.parse(raw.trim().replace(/```json|```/g, ""));
    if (Array.isArray(json)) {
      for (const q of json) {
        if (
          q.question &&
          Array.isArray(q.options) &&
          typeof q.correct === "number"
        ) {
          questions.push({
            question: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation || "",
          });
        }
      }
    }
    if (questions.length > 0) return questions.slice(0, 6);
  } catch {}

  // Fallback: parse text format
  const blocks = raw.split(/\n\n+/).filter(Boolean);
  for (const block of blocks) {
    const lines = block
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 3) continue;
    const question = lines[0].replace(/^\d+[\.\)]\s*/, "");
    const options: string[] = [];
    let correct = 0;

    for (let i = 1; i < lines.length; i++) {
      const optMatch = lines[i].match(/^[A-Da-d][\.\)]\s*(.+)/);
      if (optMatch) {
        const isCorrect = lines[i].includes("✓") || lines[i].includes("*");
        if (isCorrect) correct = options.length;
        options.push(optMatch[1].replace(/[✓\*]/g, "").trim());
      }
    }

    if (options.length >= 2) {
      questions.push({ question, options, correct, explanation: "" });
    }
  }

  return questions.slice(0, 6);
}

// ── Flashcard component ─────────────────────────────────────────────────────
function Flashcard({
  card,
  index,
  total,
}: {
  card: FlashcardData;
  index: number;
  total: number;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
        {index + 1} / {total}
      </p>
      <div
        onClick={() => setFlipped((f) => !f)}
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "160px",
          cursor: "pointer",
          perspective: "1200px",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              background: "var(--glass-bg)",
              border: "1px solid var(--border-default)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#A78BFA",
                fontWeight: "600",
              }}
            >
              Question
            </span>
            <p
              style={{
                fontSize: "16px",
                fontWeight: "500",
                color: "var(--text-primary)",
                textAlign: "center",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {card.front}
            </p>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              Tap to reveal →
            </span>
          </div>

          {/* Back */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(76,29,149,0.08))",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#A78BFA",
                fontWeight: "600",
              }}
            >
              Answer
            </span>
            <p
              style={{
                fontSize: "15px",
                fontWeight: "500",
                color: "var(--text-primary)",
                textAlign: "center",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {card.back}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quiz component ──────────────────────────────────────────────────────────
function QuizView({ questions }: { questions: QuizQuestion[] }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const q = questions[current];

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const newAnswers = [...answers, i];
    setAnswers(newAnswers);
    if (i === q.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    setAnswers([]);
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>
          {pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "📚"}
        </div>
        <p
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "var(--text-primary)",
            margin: "0 0 4px",
          }}
        >
          {score}/{questions.length} correct
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            margin: "0 0 16px",
          }}
        >
          {pct >= 80
            ? "Excellent! You nailed it."
            : pct >= 60
              ? "Good effort! Review the ones you missed."
              : "Keep studying — you've got this!"}
        </p>
        <button
          onClick={handleRestart}
          style={{
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "10px 22px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Question {current + 1} of {questions.length}
        </span>
        <span style={{ fontSize: "12px", color: "#A78BFA", fontWeight: "600" }}>
          Score: {score}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "3px",
          background: "var(--border-default)",
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(current / questions.length) * 100}%`,
            background: "linear-gradient(90deg, #7C3AED, #A78BFA)",
            borderRadius: "99px",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <p
        style={{
          fontSize: "16px",
          fontWeight: "600",
          color: "var(--text-primary)",
          margin: "4px 0 8px",
          lineHeight: 1.4,
        }}
      >
        {q.question}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {q.options.map((opt, i) => {
          let bg = "var(--glass-bg)";
          let border = "var(--border-default)";
          let color = "var(--text-primary)";

          if (selected !== null) {
            if (i === q.correct) {
              bg = "rgba(34,197,94,0.12)";
              border = "rgba(34,197,94,0.5)";
              color = "#4ade80";
            } else if (i === selected && i !== q.correct) {
              bg = "rgba(239,68,68,0.1)";
              border = "rgba(239,68,68,0.4)";
              color = "#f87171";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              style={{
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: "12px",
                padding: "12px 16px",
                textAlign: "left",
                cursor: selected !== null ? "default" : "pointer",
                color,
                fontSize: "14px",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "var(--glass-bg)",
                  border: `1px solid ${border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "600",
                  flexShrink: 0,
                  color,
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {selected !== null && i === q.correct && (
                <span style={{ marginLeft: "auto" }}>✓</span>
              )}
              {selected !== null && i === selected && i !== q.correct && (
                <span style={{ marginLeft: "auto" }}>✗</span>
              )}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {q.explanation && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                background: "var(--glass-bg)",
                border: "1px solid var(--border-default)",
                borderRadius: "10px",
                padding: "10px 14px",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              💡 {q.explanation}
            </p>
          )}
          <button
            onClick={handleNext}
            style={{
              background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              alignSelf: "flex-end",
            }}
          >
            {current + 1 >= questions.length ? "See results →" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export function FlashcardQuiz({
  messageContent,
  onGenerate,
}: FlashcardQuizProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [error, setError] = useState("");

  const handleGenerate = useCallback(
    async (type: "flashcard" | "quiz") => {
      setMode("loading");
      setError("");
      try {
        const result = await onGenerate(messageContent, type);
        if (type === "flashcard") {
          const cards = result as FlashcardData[];
          if (cards.length === 0)
            throw new Error("No cards generated. Try a longer message.");
          setFlashcards(cards);
          setCardIndex(0);
          setMode("flashcard");
        } else {
          const qs = result as QuizQuestion[];
          if (qs.length === 0)
            throw new Error("No quiz generated. Try a longer message.");
          setQuizQuestions(qs);
          setMode("quiz");
        }
      } catch (e: any) {
        setError(e.message || "Something went wrong. Try again.");
        setMode("idle");
      }
    },
    [messageContent, onGenerate],
  );

  const reset = () => {
    setMode("idle");
    setFlashcards([]);
    setQuizQuestions([]);
    setCardIndex(0);
    setError("");
  };

  return (
    <div
      style={{
        marginTop: "10px",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid var(--border-default)",
        background: "var(--glass-bg)",
      }}
    >
      {/* ── Action buttons (always visible) ── */}
      {mode === "idle" && (
        <div style={{ display: "flex", gap: "8px", padding: "10px 12px" }}>
          <button
            onClick={() => handleGenerate("flashcard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "13px",
              fontWeight: "500",
              color: "#A78BFA",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(124,58,237,0.18)";
              e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(124,58,237,0.1)";
              e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)";
            }}
          >
            🃏 Flashcards
          </button>
          <button
            onClick={() => handleGenerate("quiz")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(6,182,212,0.08)",
              border: "1px solid rgba(6,182,212,0.2)",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "13px",
              fontWeight: "500",
              color: "#22d3ee",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(6,182,212,0.15)";
              e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(6,182,212,0.08)";
              e.currentTarget.style.borderColor = "rgba(6,182,212,0.2)";
            }}
          >
            🧪 Quiz me
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {mode === "loading" && (
        <div
          style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              border: "2px solid rgba(124,58,237,0.2)",
              borderTopColor: "#7C3AED",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Generating...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: "12px 16px" }}>
          <p style={{ fontSize: "13px", color: "#f87171", margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {/* ── Flashcard view ── */}
      {mode === "flashcard" && flashcards.length > 0 && (
        <div style={{ padding: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--text-primary)",
              }}
            >
              🃏 Flashcards ({flashcards.length})
            </span>
            <button
              onClick={reset}
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✕ Close
            </button>
          </div>

          <Flashcard
            card={flashcards[cardIndex]}
            index={cardIndex}
            total={flashcards.length}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "14px",
            }}
          >
            <button
              onClick={() => setCardIndex((i) => Math.max(0, i - 1))}
              disabled={cardIndex === 0}
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "13px",
                color:
                  cardIndex === 0 ? "var(--text-muted)" : "var(--text-primary)",
                cursor: cardIndex === 0 ? "not-allowed" : "pointer",
                opacity: cardIndex === 0 ? 0.5 : 1,
              }}
            >
              ← Prev
            </button>
            <button
              onClick={() =>
                setCardIndex((i) => Math.min(flashcards.length - 1, i + 1))
              }
              disabled={cardIndex === flashcards.length - 1}
              style={{
                background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                border: "none",
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "13px",
                color: "white",
                cursor:
                  cardIndex === flashcards.length - 1
                    ? "not-allowed"
                    : "pointer",
                opacity: cardIndex === flashcards.length - 1 ? 0.5 : 1,
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Quiz view ── */}
      {mode === "quiz" && quizQuestions.length > 0 && (
        <div style={{ padding: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--text-primary)",
              }}
            >
              🧪 Quiz ({quizQuestions.length} questions)
            </span>
            <button
              onClick={reset}
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✕ Close
            </button>
          </div>
          <QuizView questions={quizQuestions} />
        </div>
      )}
    </div>
  );
}
