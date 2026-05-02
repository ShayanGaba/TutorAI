import { FileText, Image, X } from 'lucide-react';
import type { ActiveFile } from '../../types';
import { formatFileSize } from '../../utils/imageHandler';

interface FilePreviewBarProps {
  activeFile: ActiveFile;
  onRemove: () => void;
}

export function FilePreviewBar({ activeFile, onRemove }: FilePreviewBarProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2 animate-fade-in-up"
      style={{
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.25)',
      }}
    >
      {activeFile.type === 'pdf' ? (
        <FileText size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
      ) : (
        <Image size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
      )}
      <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
        {activeFile.name}
      </span>
      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        {formatFileSize(activeFile.size)}
      </span>
      {activeFile.type === 'pdf' && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
          style={{
            background: 'rgba(124,58,237,0.15)',
            color: 'var(--accent-primary)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          Active context
        </span>
      )}
      <button
        onClick={onRemove}
        className="p-0.5 rounded transition-opacity hover:opacity-70 flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
