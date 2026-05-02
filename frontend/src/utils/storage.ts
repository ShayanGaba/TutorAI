import type { ChatHistoryItem } from '../types';

const HISTORY_PREFIX = 'chat_';
const MAX_HISTORY = 10;

export function saveChat(item: ChatHistoryItem): void {
  const key = `${HISTORY_PREFIX}${item.id}`;
  localStorage.setItem(key, JSON.stringify(item));
  pruneHistory();
}

export function loadAllChats(): ChatHistoryItem[] {
  const items: ChatHistoryItem[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(HISTORY_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) items.push(JSON.parse(raw) as ChatHistoryItem);
      } catch {
        // skip malformed
      }
    }
  }
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export function deleteChat(id: string): void {
  localStorage.removeItem(`${HISTORY_PREFIX}${id}`);
}

export function clearAllChats(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(HISTORY_PREFIX)) keys.push(key);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

function pruneHistory(): void {
  const all = loadAllChats();
  if (all.length > MAX_HISTORY) {
    const toDelete = all.slice(MAX_HISTORY);
    toDelete.forEach((item) => deleteChat(item.id));
  }
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return 'yesterday';
  return `${days}d`;
}
