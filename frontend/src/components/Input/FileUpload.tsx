import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Image, X } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { formatFileSize } from '../../utils/imageHandler';

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onFile: (file: File) => void;
  isProcessing: boolean;
}

interface PreviewFile {
  file: File;
  preview?: string;
}

export function FileUpload({ isOpen, onClose, onFile, isProcessing }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewFile({ file, preview: url });
    } else {
      setPreviewFile({ file });
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleConfirm = useCallback(() => {
    if (!previewFile) return;
    onFile(previewFile.file);
    setPreviewFile(null);
    onClose();
  }, [previewFile, onFile, onClose]);

  const handleClose = useCallback(() => {
    setPreviewFile(null);
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Attach File">
      <div className="flex flex-col gap-4">
        {!previewFile ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-xl flex flex-col items-center gap-3 py-10 px-6 transition-all duration-200"
            style={{
              border: `2px dashed ${dragging ? 'var(--accent-primary)' : 'rgba(124,58,237,0.3)'}`,
              background: dragging ? 'var(--accent-glow)' : 'var(--glass-bg)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.15)' }}
            >
              <Upload size={22} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                Drop files here or click to browse
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Supports PDF documents and images (JPG, PNG, GIF, WEBP)
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Max 10MB per file
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-4 flex items-center gap-3 animate-fade-in-up"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-default)' }}
          >
            {previewFile.preview ? (
              <img
                src={previewFile.preview}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.15)' }}
              >
                <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {previewFile.file.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {formatFileSize(previewFile.file.size)} ·{' '}
                {previewFile.file.type.startsWith('image/') ? (
                  <span className="inline-flex items-center gap-1"><Image size={10} /> Image</span>
                ) : (
                  <span className="inline-flex items-center gap-1"><FileText size={10} /> PDF</span>
                )}
              </p>
            </div>
            <button
              onClick={() => setPreviewFile(null)}
              className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,image/*"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <button
          onClick={previewFile ? handleConfirm : () => inputRef.current?.click()}
          disabled={isProcessing}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
          }}
        >
          {isProcessing
            ? 'Reading file...'
            : previewFile
            ? 'Add to Chat'
            : 'Browse Files'}
        </button>
      </div>
    </Modal>
  );
}
