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

function AppInner() {
  const [currentMode, setCurrentMode] = useState<AIMode>("tutor");
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [language, setLanguage] = useState<Language>("English");

  const { theme, toggleTheme } = useTheme();
  const { toasts, addToast, removeToast } = useToast();

  const {
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
  }, [toggleTheme, stopGeneration]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text && !pendingImage) return;
    setInputValue("");
    await sendChat(
      text,
      currentMode,
      pdfContext,
      pendingImage || undefined,
      language,
    );
    if (pendingImage) clearPendingImage();
  }, [
    inputValue,
    currentMode,
    pdfContext,
    pendingImage,
    language,
    sendChat,
    clearPendingImage,
  ]);

  const handleSuggestion = useCallback(
    (text: string) => {
      setInputValue(text);
      setTimeout(() => {
        sendChat(text, currentMode, pdfContext, undefined, language);
        setInputValue("");
      }, 300);
    },
    [currentMode, pdfContext, language, sendChat],
  );

  const handleNewChat = useCallback(async () => {
    if (messagesRef.current.length > 0) {
      saveConversation(messagesRef.current, modeRef.current);
      addToast("Chat saved to history", "info");
    }
    await clearMessages();
    clearFile();
    setInputValue("");
  }, [saveConversation, clearMessages, clearFile, addToast]);

  const handleModeChange = useCallback(
    async (newMode: AIMode) => {
      if (newMode === currentMode) return;
      if (messagesRef.current.length > 0)
        saveConversation(messagesRef.current, modeRef.current);
      setMessages([]);
      setCurrentMode(newMode);
      clearFile();
      setInputValue("");
      addToast(`Switched to ${MODES[newMode].name}`, "info");
    },
    [currentMode, saveConversation, clearFile, addToast, setMessages],
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
    },
    [setMessages],
  );

  const handleClearChat = useCallback(async () => {
    if (messages.length === 0) return;
    if (window.confirm("Clear the current conversation?")) {
      await clearMessages();
      clearFile();
      addToast("Conversation cleared", "info");
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

  return (
    <div
      className="flex overflow-hidden"
      style={{ background: "var(--bg-base)", height: "100dvh" }}
    >
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-30"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${isMobile ? "fixed left-0 top-0 bottom-0 z-40" : "relative"} flex-shrink-0`}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          currentMode={currentMode}
          history={history}
          deletingIds={deletingIds}
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

      {/* Main */}
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
          onRegenerate={() => regenerateLastResponse(currentMode, pdfContext)}
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
                language,
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
            currentMode={currentMode}
            isLoading={isLoading}
            isStreaming={isStreaming}
            activeFile={activeFile}
            pendingImage={pendingImage}
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
