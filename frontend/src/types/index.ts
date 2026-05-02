import {
  BookOpen,
  Code2,
  Brain,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";

export type AIMode = "tutor" | "code" | "think" | "creative";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  mode: AIMode;
  isStreaming?: boolean;
  isStopped?: boolean;
  imageData?: string;
  isError?: boolean;
  feedback?: "up" | "down" | null;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  messages: StoredMessage[];
  mode: AIMode;
  createdAt: number;
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  mode: AIMode;
  imageData?: string;
  isError?: boolean;
  isStopped?: boolean;
}

export interface ActiveFile {
  name: string;
  size: number;
  type: "pdf" | "image";
  data?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  exiting?: boolean;
}

export interface ModeConfig {
  id: AIMode;
  Icon: LucideIcon;
  name: string;
  description: string;
  placeholder: string;
  subtitle: string;
  chips: { text: string }[];
}

export const MODES: Record<AIMode, ModeConfig> = {
  tutor: {
    id: "tutor",
    Icon: BookOpen,
    name: "TutorAI",
    description: "Explains anything simply",
    placeholder: "Ask me anything to learn...",
    subtitle: "Ask me anything — I'll explain it simply and clearly",
    chips: [
      { text: "Explain Pythagoras theorem" },
      { text: "How does DNA work?" },
      { text: "What is machine learning?" },
      { text: "Explain the Roman Empire" },
    ],
  },
  code: {
    id: "code",
    Icon: Code2,
    name: "CodeAI",
    description: "Expert programmer & debugger",
    placeholder: "Share code or describe your problem...",
    subtitle: "Share your code or problem — I'll debug and explain",
    chips: [
      { text: "Debug my Python code" },
      { text: "Explain React hooks" },
      { text: "What is async/await?" },
      { text: "How do REST APIs work?" },
    ],
  },
  think: {
    id: "think",
    Icon: Brain,
    name: "ThinkAI",
    description: "Deep reasoning & analysis",
    placeholder: "Ask your complex question...",
    subtitle: "Bring your complex questions — I'll reason through them",
    chips: [
      { text: "Is free will an illusion?" },
      { text: "Analyze climate change solutions" },
      { text: "First principles of success" },
      { text: "Analyze the trolley problem" },
    ],
  },
  creative: {
    id: "creative",
    Icon: Lightbulb,
    name: "CreativeAI",
    description: "Ideas, writing & brainstorming",
    placeholder: "Describe what you want to create...",
    subtitle: "Let's create something — ideas, writing, brainstorming",
    chips: [
      { text: "Write a startup pitch" },
      { text: "Brainstorm app ideas" },
      { text: "Draft a cold email" },
      { text: "Create a marketing strategy" },
    ],
  },
};
