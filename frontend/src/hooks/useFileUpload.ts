import { useState, useCallback } from 'react';
import type { ActiveFile } from '../types';
import { extractTextFromPDF } from '../utils/pdfExtractor';
import { fileToBase64, formatFileSize } from '../utils/imageHandler';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function useFileUpload(
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void
) {
  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);
  const [pdfContext, setPdfContext] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      onToast('File exceeds 10MB limit', 'error');
      return;
    }

    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPDF && !isImage) {
      onToast('Unsupported file type', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      if (isPDF) {
        const text = await extractTextFromPDF(file);
        setPdfContext(text);
        setActiveFile({
          name: file.name,
          size: file.size,
          type: 'pdf',
        });
        onToast(`PDF ready — Ask me anything about it`, 'success');
      } else if (isImage) {
        const base64 = await fileToBase64(file);
        setPendingImage(base64);
        setActiveFile({
          name: file.name,
          size: file.size,
          type: 'image',
          data: base64,
        });
        onToast('Image ready to send', 'success');
      }
    } catch {
      onToast(isPDF ? 'Could not read PDF. Try another file.' : 'Could not read image.', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [onToast]);

  const clearFile = useCallback(() => {
    setActiveFile(null);
    setPdfContext('');
    setPendingImage(null);
  }, []);

  const clearPendingImage = useCallback(() => {
    setPendingImage(null);
    if (activeFile?.type === 'image') {
      setActiveFile(null);
    }
  }, [activeFile]);

  return {
    activeFile,
    pdfContext,
    pendingImage,
    isProcessing,
    handleFile,
    clearFile,
    clearPendingImage,
    formatFileSize,
  };
}
