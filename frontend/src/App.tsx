import { useState, useCallback, useRef, useEffect } from "react";
import type { AIMode, ChatHistoryItem } from "./types";
import { MODES } from "./types";
import { useChat } from "./hooks/useChat";
import { useChatHistory } from "./hooks/useChatHistory";
import { useFileUpload } from "./hooks/useFileUpload";
import { useToast } from "./hooks/useToast";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { TopBar } from "./components/TopBar";
import { ChatArea } from "./components/Chat/ChatArea";
import { ChatInput } from "./components/Input/ChatInput";
import { StopButton } from "./components/Chat/StopButton";
import { FileUpload } from "./components/Input/FileUpload";
import { ToastContainer } from "./components/UI/Toast";

export default function App() {
  const [currentMode, setCurrentMode] = useState<AIMode>("tutor");
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);

  const { toasts, addToast, removeToast } = useToast();

  const {
    messages,
    isLoading,
    isStreaming,
    isThinking, // ⭐ ADDED
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

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    await sendChat(text, currentMode, pdfContext, pendingImage || undefined);
    if (pendingImage) clearPendingImage();
  }, [
    inputValue,
    currentMode,
    pdfContext,
    pendingImage,
    sendChat,
    clearPendingImage,
  ]);

  const handleSuggestion = useCallback(
    (text: string) => {
      setInputValue(text);
      setTimeout(() => {
        sendChat(text, currentMode, pdfContext, pendingImage || undefined);
        setInputValue("");
        if (pendingImage) clearPendingImage();
      }, 300);
    },
    [currentMode, pdfContext, pendingImage, sendChat, clearPendingImage],
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

      if (messagesRef.current.length > 0) {
        saveConversation(messagesRef.current, modeRef.current);
      }

      setMessages([]);
      setCurrentMode(newMode);
      clearFile();
      setInputValue("");
      addToast(`Switched to ${MODES[newMode].name} — new chat started`, "info");
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

  const handleRegenerate = useCallback(async () => {
    await regenerateLastResponse(currentMode, pdfContext);
  }, [currentMode, pdfContext, regenerateLastResponse]);

  const handleRetry = useCallback(
    async (errorContent: string) => {
      const lastUserMsg = [...messagesRef.current]
        .reverse()
        .find((m) => m.role === "user");
      if (lastUserMsg) {
        await sendChat(lastUserMsg.content, currentMode, pdfContext);
      } else {
        await sendChat(errorContent, currentMode, pdfContext);
      }
    },
    [currentMode, pdfContext, sendChat],
  );

  // Close sidebar overlay on resize
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
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-base)" }}
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

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          currentMode={currentMode}
          activeFile={activeFile}
          onToggleSidebar={() => setIsSidebarOpen((p) => !p)}
          onOpenFileUpload={() => setIsFileUploadOpen(true)}
          onClearChat={handleClearChat}
          onRemoveFile={clearFile}
        />

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          isThinking={isThinking} // ⭐ ADDED
          currentMode={currentMode}
          onSuggestion={handleSuggestion}
          onFeedback={setMessageFeedback}
          onRegenerate={handleRegenerate}
          onRetry={handleRetry}
        />

        <div
          className="flex-shrink-0"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {(isStreaming || isLoading) && (
            <div className="max-w-3xl mx-auto w-full px-4 pt-3">
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

      {/* File Upload Modal */}
      <FileUpload
        isOpen={isFileUploadOpen}
        onClose={() => setIsFileUploadOpen(false)}
        onFile={handleFile}
        isProcessing={isProcessing}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
