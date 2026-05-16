import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Trophy,
  Zap,
  BookOpen,
} from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}
interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}
interface FlashcardQuizProps {
  content: string;
  onClose: () => void;
  mode: "flashcard" | "quiz";
}

function parseFlashcards(text: string): Flashcard[] {
  const cards: Flashcard[] = [];
  const sections = text
    .split(/\n(?=#{1,3}\s|Q:|Question:|•|\d+\.|-)/)
    .filter(Boolean);
  sections.forEach((section) => {
    const lines = section
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    if (lines.length >= 2) {
      const front = lines[0]
        .replace(/^[#•\-\d\.Q:]+\s*/, "")
        .replace(/\*\*/g, "")
        .trim();
      const back = lines
        .slice(1)
        .join(" ")
        .replace(/^[A:Answer:]+\s*/i, "")
        .replace(/\*\*/g, "")
        .trim();
      if (front && back && front.length > 5 && back.length > 5)
        cards.push({ front, back });
    }
  });
  if (cards.length < 2) {
    const sentences = text
      .replace(/\*\*/g, "")
      .replace(/#{1,3}/g, "")
      .split(/[.!?]\s+/)
      .filter((s) => s.trim().length > 20)
      .slice(0, 6);
    sentences.forEach((s, i) => {
      if (sentences[i + 1])
        cards.push({ front: s.trim() + "?", back: sentences[i + 1].trim() });
    });
  }
  return cards.slice(0, 8);
}

function parseQuizQuestions(text: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const cleanText = text.replace(/\*\*/g, "").replace(/#{1,3}/g, "");
  const sentences = cleanText
    .split(/[.!]\s+/)
    .filter((s) => s.trim().length > 30)
    .slice(0, 5);
  sentences.forEach((sentence) => {
    const words = sentence.split(" ").filter((w) => w.length > 4);
    if (words.length < 3) return;
    const keyIdx = Math.floor(words.length * 0.6);
    const keyWord = words[keyIdx];
    const question = sentence.replace(keyWord, "_____") + "?";
    const wrongOptions = [
      `Not ${keyWord}`,
      words[Math.floor(words.length * 0.2)] || "None of these",
      words[words.length - 1] || "Unknown",
    ]
      .filter((w) => w !== keyWord)
      .slice(0, 3);
    const correctIndex = Math.floor(Math.random() * 4);
    const options = [...wrongOptions];
    options.splice(correctIndex, 0, keyWord);
    questions.push({
      question: question.charAt(0).toUpperCase() + question.slice(1),
      options: options.slice(0, 4),
      correct: correctIndex,
      explanation: sentence,
    });
  });
  return questions.slice(0, 5);
}

function FlashcardView({
  cards,
  onClose,
}: {
  cards: Flashcard[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const current = cards[index];
  const progress = (index / cards.length) * 100;

  const goNext = useCallback(() => {
    setAnimating(true);
    setFlipped(false);
    setTimeout(() => {
      if (index < cards.length - 1) setIndex(index + 1);
      else setCompleted(true);
      setAnimating(false);
    }, 200);
  }, [index, cards.length]);

  const goPrev = useCallback(() => {
    if (index === 0) return;
    setAnimating(true);
    setFlipped(false);
    setTimeout(() => {
      setIndex(index - 1);
      setAnimating(false);
    }, 200);
  }, [index]);

  const markKnown = () => {
    setKnown((p) => new Set(p).add(index));
    goNext();
  };
  const reset = () => {
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setCompleted(false);
  };

  if (completed) {
    const pct = Math.round((known.size / cards.length) * 100);
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          padding: "8px 0 4px",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background:
              pct >= 70
                ? "linear-gradient(135deg,#10B981,#059669)"
                : "linear-gradient(135deg,#F59E0B,#D97706)",
            boxShadow: `0 0 32px ${pct >= 70 ? "rgba(16,185,129,0.5)" : "rgba(245,158,11,0.5)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trophy size={32} color="white" />
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "var(--text-primary)",
              margin: "0 0 6px",
            }}
          >
            {pct >= 80
              ? "You crushed it! 🔥"
              : pct >= 50
                ? "Good progress! 👍"
                : "Keep practicing! 💪"}
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Knew{" "}
            <span style={{ color: "#10B981", fontWeight: "700" }}>
              {known.size}
            </span>{" "}
            of <strong>{cards.length}</strong> cards
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={reset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg,#7C3AED,#6D28D9)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
            }}
          >
            <RotateCcw size={14} /> Study again
          </button>
          <button
            onClick={onClose}
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            flex: 1,
            height: "4px",
            borderRadius: "99px",
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg,#7C3AED,#06B6D4)",
              borderRadius: "99px",
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        >
          {index + 1}/{cards.length}
        </span>
        <div style={{ display: "flex", gap: "3px" }}>
          {cards.map((_, i) => (
            <div
              key={i}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                transition: "all 0.3s ease",
                background: known.has(i)
                  ? "#10B981"
                  : i === index
                    ? "#7C3AED"
                    : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>
      </div>

      <div
        onClick={() => !animating && setFlipped(!flipped)}
        style={{
          perspective: "1200px",
          height: "190px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transition: animating
              ? "none"
              : "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              gap: "10px",
              background:
                "linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.1))",
              border: "1px solid rgba(124,58,237,0.3)",
              boxShadow: "0 8px 32px rgba(124,58,237,0.15)",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#A78BFA",
                background: "rgba(124,58,237,0.2)",
                padding: "3px 10px",
                borderRadius: "20px",
              }}
            >
              QUESTION
            </span>
            <p
              style={{
                fontSize: "17px",
                fontWeight: "500",
                color: "var(--text-primary)",
                textAlign: "center",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {current.front}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              ✦ Tap to flip
            </p>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              gap: "10px",
              background:
                "linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.1))",
              border: "1px solid rgba(16,185,129,0.35)",
              boxShadow: "0 8px 32px rgba(16,185,129,0.12)",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#10B981",
                background: "rgba(16,185,129,0.2)",
                padding: "3px 10px",
                borderRadius: "20px",
              }}
            >
              ANSWER
            </span>
            <p
              style={{
                fontSize: "15px",
                color: "var(--text-primary)",
                textAlign: "center",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {current.back}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={goPrev}
          disabled={index === 0}
          style={{
            padding: "10px",
            borderRadius: "12px",
            background: "var(--glass-bg)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
            cursor: index === 0 ? "not-allowed" : "pointer",
            opacity: index === 0 ? 0.35 : 1,
          }}
        >
          <ChevronLeft size={18} />
        </button>
        {flipped ? (
          <div style={{ display: "flex", gap: "8px", flex: 1 }}>
            <button
              onClick={goNext}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: "600",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#EF4444",
                cursor: "pointer",
              }}
            >
              Still learning 📖
            </button>
            <button
              onClick={markKnown}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: "600",
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.35)",
                color: "#10B981",
                cursor: "pointer",
              }}
            >
              Got it ✓
            </button>
          </div>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "600",
              background: "linear-gradient(135deg,#7C3AED,#6D28D9)",
              color: "white",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
            }}
          >
            Reveal Answer →
          </button>
        )}
        <button
          onClick={goNext}
          style={{
            padding: "10px",
            borderRadius: "12px",
            background: "var(--glass-bg)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

const AUTO_ADVANCE_MS = 1800;

function QuizView({
  questions,
  onClose,
}: {
  questions: QuizQuestion[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const current = questions[index];
  const progress = (index / questions.length) * 100;

  const advance = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setSelected(null);
      setCountdown(0);
    } else setCompleted(true);
  }, [index, questions.length]);

  const handleAnswer = useCallback(
    (optIdx: number) => {
      if (selected !== null) return;
      setSelected(optIdx);
      if (optIdx === current.correct) setScore((s) => s + 1);
      setCountdown(AUTO_ADVANCE_MS);
      const start = Date.now();
      intervalRef.current = setInterval(() => {
        setCountdown(Math.max(0, AUTO_ADVANCE_MS - (Date.now() - start)));
      }, 50);
      timerRef.current = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        advance();
      }, AUTO_ADVANCE_MS);
    },
    [selected, current, advance],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );
  const reset = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setCompleted(false);
    setCountdown(0);
  };
  const pct = Math.round((score / questions.length) * 100);

  if (completed) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          padding: "8px 0 4px",
        }}
      >
        <div style={{ position: "relative", width: "110px", height: "110px" }}>
          <svg
            style={{
              width: "100%",
              height: "100%",
              transform: "rotate(-90deg)",
            }}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
              style={{
                transition:
                  "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "var(--text-primary)",
              }}
            >
              {pct}%
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {score}/{questions.length}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "var(--text-primary)",
              margin: "0 0 6px",
            }}
          >
            {pct >= 80
              ? "🏆 Excellent!"
              : pct >= 60
                ? "👍 Good job!"
                : "📚 Keep studying!"}
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            {score} correct out of {questions.length}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={reset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg,#7C3AED,#6D28D9)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
            }}
          >
            <RotateCcw size={14} /> Try again
          </button>
          <button
            onClick={onClose}
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            flex: 1,
            height: "4px",
            borderRadius: "99px",
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg,#7C3AED,#06B6D4)",
              borderRadius: "99px",
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <span style={{ fontSize: "12px", fontWeight: "600", color: "#10B981" }}>
          {score}✓
        </span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {index + 1}/{questions.length}
        </span>
      </div>

      <div
        style={{
          borderRadius: "16px",
          padding: "18px 20px",
          background:
            "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.07))",
          border: "1px solid rgba(124,58,237,0.25)",
        }}
      >
        <p
          style={{
            fontSize: "16px",
            fontWeight: "500",
            color: "var(--text-primary)",
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {current.question}
        </p>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}
      >
        {current.options.map((opt, i) => {
          const isSelected = selected === i;
          const isRight = i === current.correct;
          let bg = "var(--glass-bg)",
            border = "var(--border-default)",
            color = "var(--text-secondary)";
          let icon = null;
          if (selected !== null) {
            if (isRight) {
              bg = "rgba(16,185,129,0.14)";
              border = "rgba(16,185,129,0.5)";
              color = "#10B981";
              icon = <CheckCircle size={15} />;
            } else if (isSelected) {
              bg = "rgba(239,68,68,0.12)";
              border = "rgba(239,68,68,0.5)";
              color = "#EF4444";
              icon = <XCircle size={15} />;
            }
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 14px",
                borderRadius: "14px",
                textAlign: "left",
                fontSize: "13px",
                fontWeight: "500",
                background: bg,
                border: `1px solid ${border}`,
                color,
                cursor: selected !== null ? "default" : "pointer",
                transition: "all 0.25s ease",
                transform:
                  isSelected && selected !== null ? "scale(1.01)" : "scale(1)",
              }}
            >
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "8px",
                  background: "rgba(124,58,237,0.18)",
                  color: "#A78BFA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "700",
                  flexShrink: 0,
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1, lineHeight: 1.3 }}>{opt}</span>
              {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {current.explanation && (
            <div
              style={{
                borderRadius: "12px",
                padding: "12px 14px",
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
                fontSize: "13px",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: "#A78BFA", fontWeight: "700" }}>💡 </span>
              {current.explanation}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                flex: 1,
                height: "3px",
                borderRadius: "99px",
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(countdown / AUTO_ADVANCE_MS) * 100}%`,
                  background: "rgba(124,58,237,0.6)",
                  borderRadius: "99px",
                  transition: "width 0.05s linear",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              Next in {(countdown / 1000).toFixed(1)}s
            </span>
            <button
              onClick={advance}
              style={{
                fontSize: "11px",
                color: "#A78BFA",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0 4px",
                fontWeight: "600",
              }}
            >
              Skip →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FlashcardQuiz({ content, onClose, mode }: FlashcardQuizProps) {
  const flashcards = parseFlashcards(content);
  const quizQuestions = parseQuizQuestions(content);
  const hasEnough =
    mode === "flashcard" ? flashcards.length >= 2 : quizQuestions.length >= 2;

  return (
    <div
      style={{
        borderRadius: "24px",
        overflow: "hidden",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4),0 0 0 1px rgba(124,58,237,0.1)",
        maxWidth: "520px",
        width: "100%",
        animation: "scaleIn 0.25s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          background:
            mode === "flashcard"
              ? "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(124,58,237,0.04))"
              : "linear-gradient(135deg,rgba(6,182,212,0.1),rgba(6,182,212,0.04))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "12px",
              background:
                mode === "flashcard"
                  ? "rgba(124,58,237,0.25)"
                  : "rgba(6,182,212,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {mode === "flashcard" ? (
              <BookOpen size={16} style={{ color: "#A78BFA" }} />
            ) : (
              <Zap size={16} style={{ color: "#06B6D4" }} />
            )}
          </div>
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--text-primary)",
                margin: "0 0 1px",
              }}
            >
              {mode === "flashcard" ? "✨ Flashcards" : "⚡ Quick Quiz"}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              {mode === "flashcard"
                ? `${flashcards.length} cards · tap to flip`
                : `${quizQuestions.length} questions · auto-advances`}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: "var(--glass-bg)",
            border: "1px solid var(--border-default)",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={14} />
        </button>
      </div>
      <div style={{ padding: "20px" }}>
        {!hasEnough ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Not enough content. Ask a more detailed question first!
            </p>
          </div>
        ) : mode === "flashcard" ? (
          <FlashcardView cards={flashcards} onClose={onClose} />
        ) : (
          <QuizView questions={quizQuestions} onClose={onClose} />
        )}
      </div>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.94) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

interface StudyActionsProps {
  onFlashcard: () => void;
  onQuiz: () => void;
}

export function StudyActions({ onFlashcard, onQuiz }: StudyActionsProps) {
  return (
    <div
      style={{
        margin: "12px 0 16px 44px",
        animation: "slideUpFade 0.35s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: "600",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          margin: "0 0 10px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "16px",
            height: "1px",
            background: "var(--border-default)",
          }}
        />
        Study this response
        <span
          style={{
            display: "inline-block",
            width: "16px",
            height: "1px",
            background: "var(--border-default)",
          }}
        />
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={onFlashcard}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 18px",
            borderRadius: "16px",
            background:
              "linear-gradient(135deg,rgba(124,58,237,0.18) 0%,rgba(109,40,217,0.08) 100%)",
            border: "1px solid rgba(124,58,237,0.4)",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
            overflow: "hidden",
            minWidth: "170px",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.transform = "translateY(-2px)";
            el.style.boxShadow = "0 8px 28px rgba(124,58,237,0.3)";
            el.style.borderColor = "rgba(124,58,237,0.7)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.transform = "translateY(0)";
            el.style.boxShadow = "none";
            el.style.borderColor = "rgba(124,58,237,0.4)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-10px",
              right: "-10px",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(124,58,237,0.2)",
              filter: "blur(16px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "linear-gradient(135deg,#7C3AED,#6D28D9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(124,58,237,0.45)",
              flexShrink: 0,
            }}
          >
            <BookOpen size={18} color="white" />
          </div>
          <div style={{ textAlign: "left" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#C4B5FD",
                margin: "0 0 2px",
              }}
            >
              Flashcards
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "rgba(196,181,253,0.6)",
                margin: 0,
              }}
            >
              Flip · Learn · Repeat
            </p>
          </div>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "16px",
              color: "rgba(196,181,253,0.5)",
            }}
          >
            →
          </span>
        </button>

        <button
          onClick={onQuiz}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 18px",
            borderRadius: "16px",
            background:
              "linear-gradient(135deg,rgba(6,182,212,0.15) 0%,rgba(6,182,212,0.06) 100%)",
            border: "1px solid rgba(6,182,212,0.35)",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
            overflow: "hidden",
            minWidth: "170px",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.transform = "translateY(-2px)";
            el.style.boxShadow = "0 8px 28px rgba(6,182,212,0.25)";
            el.style.borderColor = "rgba(6,182,212,0.6)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.transform = "translateY(0)";
            el.style.boxShadow = "none";
            el.style.borderColor = "rgba(6,182,212,0.35)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-10px",
              right: "-10px",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(6,182,212,0.15)",
              filter: "blur(16px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "linear-gradient(135deg,#0EA5E9,#06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(6,182,212,0.4)",
              flexShrink: 0,
            }}
          >
            <Zap size={18} color="white" />
          </div>
          <div style={{ textAlign: "left" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#67E8F9",
                margin: "0 0 2px",
              }}
            >
              Quiz me
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "rgba(103,232,249,0.55)",
                margin: 0,
              }}
            >
              5 Qs · Auto-advance
            </p>
          </div>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "16px",
              color: "rgba(103,232,249,0.4)",
            }}
          >
            →
          </span>
        </button>
      </div>
      <style>{`@keyframes slideUpFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
