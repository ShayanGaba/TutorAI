import { MessageSquare, X } from 'lucide-react';
import type { ChatHistoryItem } from '../../types';
import { formatTimeAgo } from '../../utils/storage';

interface ChatHistoryProps {
  history: ChatHistoryItem[];
  deletingIds: Set<string>;
  onSelect: (item: ChatHistoryItem) => void;
  onDelete: (id: string) => void;
}

export function ChatHistory({ history, deletingIds, onSelect, onDelete }: ChatHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="px-3">
      <p
        className="px-2 mb-2 text-xs font-semibold tracking-widest uppercase"
        style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}
      >
        Recent
      </p>
      <div className="flex flex-col gap-0.5">
        {history.map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            isDeleting={deletingIds.has(item.id)}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryItem({
  item,
  isDeleting,
  onSelect,
  onDelete,
}: {
  item: ChatHistoryItem;
  isDeleting: boolean;
  onSelect: (item: ChatHistoryItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`group flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 ${
        isDeleting ? 'animate-slide-out-left' : ''
      }`}
      style={{ background: 'transparent' }}
      onClick={() => onSelect(item)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--glass-bg-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      <MessageSquare size={13} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
      <div className="flex-1 min-w-0">
        <span
          className="text-xs truncate block"
          style={{ color: 'var(--text-secondary)' }}
        >
          {item.title || 'New conversation'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs flex-shrink-0 opacity-70" style={{ color: 'var(--text-muted)' }}>
          {formatTimeAgo(item.createdAt)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="opacity-0 group-hover:opacity-100 rounded p-0.5 transition-all duration-150 hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
