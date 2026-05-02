import { useState, useCallback, useEffect } from 'react';
import type { ChatHistoryItem, Message, AIMode } from '../types';
import { saveChat, loadAllChats, deleteChat, clearAllChats } from '../utils/storage';

export function useChatHistory() {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setHistory(loadAllChats());
  }, []);

  const saveConversation = useCallback((messages: Message[], mode: AIMode) => {
    if (messages.length === 0) return;
    const userMsg = messages.find((m) => m.role === 'user');
    if (!userMsg) return;

    const id = `${Date.now()}`;
    const item: ChatHistoryItem = {
      id,
      title: userMsg.content.slice(0, 30),
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        mode: m.mode,
        imageData: m.imageData,
        isError: m.isError,
        isStopped: m.isStopped,
      })),
      mode,
      createdAt: Date.now(),
    };

    saveChat(item);
    setHistory(loadAllChats());
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      deleteChat(id);
      setHistory(loadAllChats());
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }, []);

  const clearHistory = useCallback(() => {
    clearAllChats();
    setHistory([]);
  }, []);

  const refreshHistory = useCallback(() => {
    setHistory(loadAllChats());
  }, []);

  return {
    history,
    deletingIds,
    saveConversation,
    removeFromHistory,
    clearHistory,
    refreshHistory,
  };
}
