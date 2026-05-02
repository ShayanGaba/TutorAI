import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import type { ToastItem } from '../../types';

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: '320px' }}
    >
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastNotification({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const config = {
    success: {
      icon: <CheckCircle size={16} />,
      borderColor: 'var(--success)',
      iconColor: '#10B981',
    },
    error: {
      icon: <XCircle size={16} />,
      borderColor: 'var(--error)',
      iconColor: '#EF4444',
    },
    info: {
      icon: <Info size={16} />,
      borderColor: 'var(--accent-primary)',
      iconColor: '#7C3AED',
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 ${
        toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
      }`}
      style={{
        background: 'rgba(20, 20, 32, 0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid var(--border-default)`,
        borderLeft: `3px solid ${config.borderColor}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        minWidth: '260px',
      }}
    >
      <span style={{ color: config.iconColor, flexShrink: 0, marginTop: '1px' }}>
        {config.icon}
      </span>
      <span className="text-sm flex-1" style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 transition-colors hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
