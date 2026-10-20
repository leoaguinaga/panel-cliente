export type PreviewableType = 'docx' | 'image' | 'pdf' | 'unsupported';

export function getFilePreviewType(filename?: string | null, mimeType?: string | null): PreviewableType {
  if (!filename && !mimeType) return 'unsupported';

  const lowerName = (filename || '').toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  // DOCX check
  if (
    lowerName.endsWith('.docx') ||
    lowerMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }

  // Image check
  if (
    lowerMime.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|svg|gif|bmp|ico|avif)$/i.test(lowerName)
  ) {
    return 'image';
  }

  // PDF check
  if (
    lowerMime === 'application/pdf' ||
    lowerName.endsWith('.pdf')
  ) {
    return 'pdf';
  }

  return 'unsupported';
}

export function getFileExtension(filename?: string | null): string {
  if (!filename) return 'ARCHIVO';
  const parts = filename.split('.');
  if (parts.length < 2) return 'ARCHIVO';
  return parts.pop()!.toUpperCase();
}

export function getFileTypeLabel(previewType: PreviewableType, filename?: string | null): string {
  switch (previewType) {
    case 'docx':
      return 'Documento Word (.docx)';
    case 'image':
      return 'Imagen';
    case 'pdf':
      return 'Documento PDF';
    default:
      return `Archivo ${getFileExtension(filename)}`;
  }
}
