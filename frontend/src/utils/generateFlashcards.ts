const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getSessionId(): string {
  let id = localStorage.getItem("tutorai_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("tutorai_session", id);
  }
  return id;
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

// Parse flashcard JSON safely
function parseFlashcards(raw: string): FlashcardData[] {
  try {
    const cleaned = raw
      .trim()
      .replace(/```json|```/gi, "")
      .trim();
    const json = JSON.parse(cleaned);
    if (Array.isArray(json)) {
      return json
        .filter((item) => item.front && item.back)
        .map((item) => ({ front: String(item.front), back: String(item.back) }))
        .slice(0, 10);
    }
  } catch {}

  // Text fallback
  const cards: FlashcardData[] = [];
  const lines = raw.split("\n").filter((l) => l.trim());
  for (let i = 0; i < lines.length - 1; i++) {
    const fMatch = lines[i].match(/^(?:Q|Front|Term)[:\-]\s*(.+)/i);
    const bMatch = lines[i + 1]?.match(
      /^(?:A|Back|Definition|Answer)[:\-]\s*(.+)/i,
    );
    if (fMatch && bMatch) {
      cards.push({ front: fMatch[1].trim(), back: bMatch[1].trim() });
      i++;
    }
  }
  return cards.slice(0, 10);
}

// Parse quiz JSON safely
function parseQuiz(raw: string): QuizQuestion[] {
  try {
    const cleaned = raw
      .trim()
      .replace(/```json|```/gi, "")
      .trim();
    const json = JSON.parse(cleaned);
    if (Array.isArray(json)) {
      return json
        .filter(
          (q) =>
            q.question &&
            Array.isArray(q.options) &&
            q.options.length >= 2 &&
            typeof q.correct === "number",
        )
        .map((q) => ({
          question: String(q.question),
          options: q.options.map(String),
          correct: Number(q.correct),
          explanation: String(q.explanation || ""),
        }))
        .slice(0, 6);
    }
  } catch {}
  return [];
}

export async function generateFlashcards(
  content: string,
): Promise<FlashcardData[]> {
  const prompt = `Based on the following educational content, generate exactly 6 flashcards.

Return ONLY a valid JSON array with no extra text, no markdown, no explanation:
[
  {"front": "question or term here", "back": "answer or definition here"},
  ...
]

Content to turn into flashcards:
"""
${content.slice(0, 3000)}
"""`;

  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "session-id": getSessionId(),
    },
    body: JSON.stringify({
      message: prompt,
      mode: "tutor",
      pdf_context: "",
      image_data: null,
      language: "English",
    }),
  });

  if (!res.ok) throw new Error("Failed to generate flashcards");

  // Read full SSE stream
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.chunk) full += json.chunk;
        if (json.done) break;
      } catch {}
    }
  }

  const cards = parseFlashcards(full);
  if (cards.length === 0)
    throw new Error("Couldn't parse flashcards. Try a longer response.");
  return cards;
}

export async function generateQuiz(content: string): Promise<QuizQuestion[]> {
  const prompt = `Based on the following educational content, generate exactly 5 multiple-choice quiz questions.

Return ONLY a valid JSON array with no extra text, no markdown, no explanation:
[
  {
    "question": "question text",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": 0,
    "explanation": "brief explanation of why this is correct"
  },
  ...
]

The "correct" field is the 0-based index of the correct option.

Content to quiz on:
"""
${content.slice(0, 3000)}
"""`;

  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "session-id": getSessionId(),
    },
    body: JSON.stringify({
      message: prompt,
      mode: "tutor",
      pdf_context: "",
      image_data: null,
      language: "English",
    }),
  });

  if (!res.ok) throw new Error("Failed to generate quiz");

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.chunk) full += json.chunk;
        if (json.done) break;
      } catch {}
    }
  }

  const questions = parseQuiz(full);
  if (questions.length === 0)
    throw new Error("Couldn't parse quiz. Try a longer response.");
  return questions;
}
