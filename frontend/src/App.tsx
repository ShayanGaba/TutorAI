import { useState, useCallback, useRef, useEffect } from "react";
import type { AIMode, ChatHistoryItem, Language } from "./types";
import { MODES } from "./types";
import { useChat } from "./hooks/useChat";
import { useChatHistory } from "./hooks/useChatHistory";
import { useFileUpload } from "./hooks/useFileUpload";
import { useToast } from "./hooks/useToast";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { TopBar } from "./components/TopBar";
import { ChatArea } from "./components/Chat/ChatArea";
import { ChatInput } from "./components/Input/ChatInput";
import { StopButton } from "./components/Chat/StopButton";
import { FileUpload } from "./components/Input/FileUpload";
import { ToastContainer } from "./components/UI/Toast";
import { KeyboardShortcuts } from "./components/UI/KeyboardShortcuts";
import { WelcomeScreen } from "./components/Chat/WelcomeScreen";

function extractYouTubeUrl(text: string): string | null {
  const patterns = [
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?[^\s]*/,
    /https?:\/\/youtu\.be\/[^\s]*/,
    /https?:\/\/(?:www\.)?youtube\.com\/shorts\/[^\s]*/,
    /https?:\/\/(?:www\.)?youtube\.com\/embed\/[^\s]*/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

function AppInner() {
  const [currentMode, setCurrentMode] = useState<AIMode>("tutor");
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [language, setLanguage] = useState<Language>("English");

  // ── THE ONE STATE THAT CONTROLS EVERYTHING ────────────────────────────────
  // true  = show the full Vyse welcome page (first load, after New Chat)
  // false = show the chat layout (after picking a mode, or sidebar mode switch)
  const [showWelcome, setShowWelcome] = useState(true);

  const { toggleTheme } = useTheme();
  const { toasts, addToast, removeToast } = useToast();

  const {
    messages,
    isLoading,
    isStreaming,
    isThinking,
    sendChat,
    sendYouTube,
    stopGeneration,
    clearMessages,
    regenerateLastResponse,
    setMessageFeedback,
    setMessages,
  } = useChat(addToast);

  const {
    history,
    deletingIds,
    saveConversation,
    removeFromHistory,
    clearHistory,
  } = useChatHistory();
  const {
    activeFile,
    pdfContext,
    pendingImage,
    isProcessing,
    handleFile,
    clearFile,
    clearPendingImage,
  } = useFileUpload(addToast);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const modeRef = useRef(currentMode);
  modeRef.current = currentMode;
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showWelcome) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "/") {
          e.preventDefault();
          setShowShortcuts((p) => !p);
        }
        if (e.key === "l" || e.key === "L") {
          e.preventDefault();
          toggleTheme();
        }
        if (e.key === "k" || e.key === "K") {
          e.preventDefault();
          handleClearChat();
        }
        if (e.key === "1") {
          e.preventDefault();
          handleModeChange("tutor");
        }
        if (e.key === "2") {
          e.preventDefault();
          handleModeChange("code");
        }
        if (e.key === "3") {
          e.preventDefault();
          handleModeChange("think");
        }
        if (e.key === "4") {
          e.preventDefault();
          handleModeChange("creative");
        }
        if (e.key === "5") {
          e.preventDefault();
          handleModeChange("youtube");
        }
      }
      if (e.key === "Escape") {
        stopGeneration();
        setShowShortcuts(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleTheme, stopGeneration, showWelcome]);

  // Called when user picks a mode card on the Vyse welcome page
  const handleWelcomeModeSelect = useCallback((mode: AIMode) => {
    setCurrentMode(mode);
    setShowWelcome(false); // ← enter chat layout
  }, []);

  // Called when user clicks a suggestion chip on the Vyse welcome page
  const handleWelcomeSuggestion = useCallback(
    (text: string) => {
      setShowWelcome(false); // ← enter chat layout first
      setTimeout(() => {
        sendChat(text, currentMode, "", undefined, languageRef.current);
      }, 50);
    },
    [currentMode, sendChat],
  );

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text && !pendingImage) return;
    setInputValue("");
    const youtubeUrl = extractYouTubeUrl(text);
    if (youtubeUrl && !pendingImage) {
      await sendYouTube(youtubeUrl, text, languageRef.current);
      return;
    }
    await sendChat(
      text,
      currentMode,
      pdfContext,
      pendingImage || undefined,
      languageRef.current,
    );
    if (pendingImage) clearPendingImage();
  }, [
    inputValue,
    currentMode,
    pdfContext,
    pendingImage,
    sendChat,
    sendYouTube,
    clearPendingImage,
  ]);

  const handleSuggestion = useCallback(
    (text: string) => {
      setInputValue("");
      const youtubeUrl = extractYouTubeUrl(text);
      if (youtubeUrl) {
        sendYouTube(youtubeUrl, text, languageRef.current);
      } else {
        sendChat(text, currentMode, pdfContext, undefined, languageRef.current);
      }
    },
    [currentMode, pdfContext, sendChat, sendYouTube],
  );

  // New Chat → save current → show Vyse welcome page again
  const handleNewChat = useCallback(async () => {
    if (messagesRef.current.length > 0) {
      saveConversation(messagesRef.current, modeRef.current);
      addToast("Chat saved to history", "info");
    }
    await clearMessages();
    clearFile();
    setInputValue("");
    setShowWelcome(true); // ← back to full Vyse welcome page
  }, [saveConversation, clearMessages, clearFile, addToast]);

  // Sidebar mode switch → stay in chat layout, ChatArea shows "Hello I'm X" inside
  const handleModeChange = useCallback(
    async (newMode: AIMode) => {
      if (newMode === currentMode && !showWelcome) return;
      if (messagesRef.current.length > 0)
        saveConversation(messagesRef.current, modeRef.current);
      setMessages([]);
      setCurrentMode(newMode);
      clearFile();
      setInputValue("");
      setShowWelcome(false); // ← stay in chat layout, NOT the Vyse welcome page
      addToast(`Switched to ${MODES[newMode].name}`, "info");
    },
    [
      currentMode,
      showWelcome,
      saveConversation,
      clearFile,
      addToast,
      setMessages,
    ],
  );

  const handleSelectHistory = useCallback(
    (item: ChatHistoryItem) => {
      const restored = item.messages.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
        feedback: null as null,
      }));
      setMessages(restored);
      setCurrentMode(item.mode);
      setShowWelcome(false);
    },
    [setMessages],
  );

  const handleClearChat = useCallback(async () => {
    if (messages.length === 0) return;
    if (window.confirm("Clear the current conversation?")) {
      await clearMessages();
      clearFile();
      addToast("Conversation cleared", "info");
      setShowWelcome(true); // ← back to Vyse welcome page
    }
  }, [messages.length, clearMessages, clearFile, addToast]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = window.innerWidth < 768;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER 1: Full Vyse welcome page — shown ONLY on first load and New Chat
  // No sidebar. No topbar. Just the welcome page taking up the full screen.
  // ═══════════════════════════════════════════════════════════════════════════
  if (showWelcome) {
    return (
      <div
        style={{
          height: "100dvh",
          background: "var(--bg-base)",
          overflow: "auto",
        }}
      >
        <WelcomeScreen
          mode={currentMode}
          onSuggestion={handleWelcomeSuggestion}
          onModeChange={handleWelcomeModeSelect}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER 2: Full chat layout — shown after user picks a mode
  // ChatArea internally shows "Hello I'm CodeAI" when messages = []
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="flex overflow-hidden"
      style={{ background: "var(--bg-base)", height: "100dvh" }}
    >
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-30"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`${isMobile ? "fixed left-0 top-0 bottom-0 z-40" : "relative"} flex-shrink-0`}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          currentMode={currentMode}
          history={history}
          deletingIds={deletingIds}
          isLoading={isLoading || isStreaming} 
          onNewChat={handleNewChat}
          onModeChange={handleModeChange}
          onSelectHistory={handleSelectHistory}
          onDeleteHistory={removeFromHistory}
          onClearHistory={() => {
            clearHistory();
            addToast("All history cleared", "info");
          }}
          onClose={() => isMobile && setIsSidebarOpen(false)}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          currentMode={currentMode}
          activeFile={activeFile}
          messages={messages}
          language={language}
          onToggleSidebar={() => setIsSidebarOpen((p) => !p)}
          onOpenFileUpload={() => setIsFileUploadOpen(true)}
          onClearChat={handleClearChat}
          onRemoveFile={clearFile}
          onToggleShortcuts={() => setShowShortcuts((p) => !p)}
          onLanguageChange={setLanguage}
        />

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          isThinking={isThinking}
          currentMode={currentMode}
          onSuggestion={handleSuggestion}
          onFeedback={setMessageFeedback}
          onModeChange={handleModeChange}
          onRegenerate={() =>
            regenerateLastResponse(currentMode, pdfContext, languageRef.current)
          }
          onRetry={async () => {
            const last = [...messagesRef.current]
              .reverse()
              .find((m) => m.role === "user");
            if (last)
              await sendChat(
                last.content,
                currentMode,
                pdfContext,
                undefined,
                languageRef.current,
              );
          }}
        />

        <div className="flex-shrink-0">
          {(isStreaming || isLoading) && (
            <div className="max-w-3xl mx-auto w-full px-4 pt-2">
              <StopButton onStop={stopGeneration} />
            </div>
          )}
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            onSuggestionSelect={handleSuggestion}
            currentMode={currentMode}
            isLoading={isLoading}
            isStreaming={isStreaming}
            activeFile={activeFile}
            pendingImage={pendingImage}
            hasMessages={messages.length > 0}
            onOpenFileUpload={() => setIsFileUploadOpen(true)}
            onRemoveFile={clearFile}
          />
        </div>
      </div>

      <FileUpload
        isOpen={isFileUploadOpen}
        onClose={() => setIsFileUploadOpen(false)}
        onFile={handleFile}
        isProcessing={isProcessing}
      />
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
