import { useState, useCallback, useRef } from "react";
import type { Message, AIMode } from "../types";
import { sendMessage, summarizeYouTube, resetConversation } from "../utils/api";

let msgCounter = 0;
const genId = () => `msg-${++msgCounter}-${Date.now()}`;

// Realistic streaming: buffers chunks and drains them at natural reading pace
function createStreamingBuffer(
  onChunk: (char: string) => void,
  onDone: () => void,
) {
  const buffer: string[] = [];
  let draining = false;
  let finished = false;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const SPEED_MS = 18;

  function drain() {
    if (draining) return;
    draining = true;
    intervalId = setInterval(() => {
      if (buffer.length > 0) {
        const charsPerTick =
          buffer.length > 50 ? 3 : buffer.length > 20 ? 2 : 1;
        for (let i = 0; i < charsPerTick && buffer.length > 0; i++) {
          onChunk(buffer.shift()!);
        }
      } else if (finished) {
        if (intervalId) clearInterval(intervalId);
        draining = false;
        onDone();
      }
    }, SPEED_MS);
  }

  return {
    push(chunk: string) {
      for (const char of chunk) {
        buffer.push(char);
      }
      if (!draining) drain();
    },
    finish() {
      finished = true;
    },
    abort() {
      if (intervalId) clearInterval(intervalId);
      buffer.length = 0;
      finished = true;
      draining = false;
    },
  };
}

export function useChat(
  onToast: (msg: string, type: "success" | "error" | "info") => void,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);
  const streamingIdRef = useRef<string | null>(null);
  const bufferRef = useRef<ReturnType<typeof createStreamingBuffer> | null>(
    null,
  );

  // ─── Core streaming executor (shared by sendChat + sendYouTube) ───
  const _executeStream = useCallback(
    async (
      userMsg: Message,
      mode: AIMode,
      apiFn: (
        signal: AbortSignal,
        onChunk: (chunk: string) => void,
      ) => Promise<string>,
    ) => {
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setIsThinking(true);

      abortRef.current = new AbortController();
      const aiId = genId();
      streamingIdRef.current = aiId;

      try {
        let aiMsgAdded = false;
        let fullContent = "";

        const streamer = createStreamingBuffer(
          (char) => {
            fullContent += char;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiId ? { ...m, content: fullContent } : m,
              ),
            );
          },
          () => {
            setIsStreaming(false);
            setIsThinking(false);
            setIsLoading(false);
            setStreamingMessageId(null);
            streamingIdRef.current = null;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiId ? { ...m, isStreaming: false } : m,
              ),
            );
          },
        );
        bufferRef.current = streamer;

        await apiFn(abortRef.current.signal, (chunk) => {
          if (!aiMsgAdded) {
            aiMsgAdded = true;
            setIsThinking(false);
            setIsLoading(false);
            setMessages((prev) => [
              ...prev,
              {
                id: aiId,
                role: "assistant" as const,
                content: "",
                timestamp: new Date(),
                mode,
                isStreaming: true,
              },
            ]);
            setIsStreaming(true);
            setStreamingMessageId(aiId);
          }
          streamer.push(chunk);
        });

        streamer.finish();
      } catch (err) {
        bufferRef.current?.abort();
        setIsLoading(false);
        setIsStreaming(false);
        setIsThinking(false);
        setStreamingMessageId(null);
        streamingIdRef.current = null;

        const errMsg =
          err instanceof Error && err.message.includes("Failed to fetch")
            ? "No connection. Check internet and try again."
            : err instanceof Error && err.message !== ""
              ? err.message
              : "Something went wrong. Try again.";

        onToast(errMsg, "error");

        setMessages((prev) => {
          const hasAiBubble = prev.find((m) => m.id === aiId);
          if (hasAiBubble) {
            return prev.map((m) =>
              m.id === aiId
                ? { ...m, content: errMsg, isStreaming: false, isError: true }
                : m,
            );
          }
          return [
            ...prev,
            {
              id: genId(),
              role: "assistant" as const,
              content: errMsg,
              timestamp: new Date(),
              mode,
              isError: true,
            },
          ];
        });
      }
    },
    [onToast],
  );

  // ─── Send normal chat message ───
  const sendChat = useCallback(
    async (
      userText: string,
      mode: AIMode,
      pdfContext: string,
      imageData?: string,
      language: string = "English",
    ) => {
      if (isLoading || isStreaming) return;

      const userMsg: Message = {
        id: genId(),
        role: "user",
        content: userText,
        timestamp: new Date(),
        mode,
        imageData,
      };

      await _executeStream(userMsg, mode, (signal, onChunk) =>
        sendMessage(
          userText,
          mode,
          pdfContext,
          imageData,
          signal,
          onChunk,
          undefined,
          language,
        ),
      );
    },
    [isLoading, isStreaming, _executeStream],
  );

  // ─── Send YouTube URL for analysis ───
  const sendYouTube = useCallback(
    async (
      youtubeUrl: string,
      originalMessage: string,
      language: string = "English",
    ) => {
      if (isLoading || isStreaming) return;

      // Show the user's original message in the chat
      const userMsg: Message = {
        id: genId(),
        role: "user",
        content: originalMessage,
        timestamp: new Date(),
        mode: "youtube" as AIMode,
      };

      await _executeStream(userMsg, "youtube" as AIMode, (signal, onChunk) =>
        summarizeYouTube(youtubeUrl, language, signal, onChunk),
      );
    },
    [isLoading, isStreaming, _executeStream],
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    bufferRef.current?.abort();

    const currentId = streamingIdRef.current;
    if (currentId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === currentId
            ? { ...m, isStreaming: false, isStopped: true }
            : m,
        ),
      );
    }

    setIsStreaming(false);
    setIsLoading(false);
    setIsThinking(false);
    setStreamingMessageId(null);
    streamingIdRef.current = null;
    bufferRef.current = null;
  }, []);

  const clearMessages = useCallback(async () => {
    bufferRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
    setIsStreaming(false);
    setIsThinking(false);
    setStreamingMessageId(null);
    streamingIdRef.current = null;
    bufferRef.current = null;
    await resetConversation();
  }, []);

  const regenerateLastResponse = useCallback(
    async (mode: AIMode, pdfContext: string, language: string = "English") => {
      const lastUserMsg = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      if (!lastUserMsg) return;

      setMessages((prev) => {
        const idx = prev.findLastIndex((m) => m.role === "assistant");
        if (idx === -1) return prev;
        return prev.filter((_, i) => i !== idx);
      });

      await sendChat(
        lastUserMsg.content,
        mode,
        pdfContext,
        lastUserMsg.imageData,
        language,
      );
    },
    [messages, sendChat],
  );

  const setMessageFeedback = useCallback(
    (id: string, feedback: "up" | "down") => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, feedback: m.feedback === feedback ? null : feedback }
            : m,
        ),
      );
    },
    [],
  );

  return {
    messages,
    isLoading,
    isStreaming,
    isThinking,
    streamingMessageId,
    sendChat,
    sendYouTube,
    stopGeneration,
    clearMessages,
    regenerateLastResponse,
    setMessageFeedback,
    setMessages,
  };
}
