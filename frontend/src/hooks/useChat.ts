import { useState, useCallback, useRef } from "react";
import type { Message, AIMode } from "../types";
import { sendMessage, resetConversation } from "../utils/api";

let msgCounter = 0;
const genId = () => `msg-${++msgCounter}-${Date.now()}`;

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

  const sendChat = useCallback(
    async (
      userText: string,
      mode: AIMode,
      pdfContext: string,
      imageData?: string,
    ) => {
      if (isLoading || isStreaming) return;

      // Add user message
      const userMsg: Message = {
        id: genId(),
        role: "user",
        content: userText,
        timestamp: new Date(),
        mode,
        imageData,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Show thinking ONLY (no AI bubble yet)
      setIsLoading(true);
      setIsThinking(true);

      abortRef.current = new AbortController();
      const aiId = genId();
      streamingIdRef.current = aiId;

      try {
        let aiMsgAdded = false;

        await sendMessage(
          userText,
          mode,
          pdfContext,
          imageData,
          abortRef.current.signal,
          (chunk) => {
            // First chunk — hide thinking, add AI bubble, start streaming
            if (!aiMsgAdded) {
              aiMsgAdded = true;
              setIsThinking(false);
              setIsLoading(false);

              // Add AI message bubble NOW (first chunk arrived)
              setMessages((prev) => [
                ...prev,
                {
                  id: aiId,
                  role: "assistant",
                  content: chunk,
                  timestamp: new Date(),
                  mode,
                  isStreaming: true,
                },
              ]);
              setIsStreaming(true);
              setStreamingMessageId(aiId);
              return;
            }

            // Subsequent chunks — append to existing bubble
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiId ? { ...m, content: m.content + chunk } : m,
              ),
            );
          },
          () => {
            // onStart callback — not needed here
          },
        );

        // Stream complete
        setIsStreaming(false);
        setIsThinking(false);
        setIsLoading(false);
        setStreamingMessageId(null);
        streamingIdRef.current = null;

        setMessages((prev) =>
          prev.map((m) => (m.id === aiId ? { ...m, isStreaming: false } : m)),
        );
      } catch (err) {
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

        // Show error in chat
        setMessages((prev) => {
          // If AI bubble was never added, add error bubble
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
    [isLoading, isStreaming, onToast],
  );

  const stopGeneration = useCallback(() => {
    // Abort the fetch
    abortRef.current?.abort();

    const currentId = streamingIdRef.current;

    // Mark message as stopped (keep whatever content is there)
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
  }, []);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    setIsLoading(false);
    setIsStreaming(false);
    setIsThinking(false);
    setStreamingMessageId(null);
    streamingIdRef.current = null;
    await resetConversation();
  }, []);

  const regenerateLastResponse = useCallback(
    async (mode: AIMode, pdfContext: string) => {
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
    stopGeneration,
    clearMessages,
    regenerateLastResponse,
    setMessageFeedback,
    setMessages,
  };
}
