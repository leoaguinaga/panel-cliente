import {
  Archive,
  FileSpreadsheet,
  FileText,
  FileType,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import { getFileExtension, getFilePreviewType } from '@/src/lib/file-preview-helpers';

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  COMMERCIAL_PROPOSAL: 'Propuesta',
  SIGNED_CONTRACT: 'Contrato',
  INVOICE: 'Factura',
  PAYMENT_PROOF: 'Comprobante',
  DELIVERABLE: 'Entregable',
  INTERNAL_FILE: 'Interno',
  OTHER: 'Otro',
};

export const DOCUMENT_TYPES = Object.entries(DOCUMENT_TYPE_LABELS);

export function DocumentIcon({
  name,
  mimeType,
  size = 18,
}: {
  name: string;
  mimeType?: string | null;
  size?: number;
}) {
  switch (getFilePreviewType(name, mimeType)) {
    case 'docx':
      return <FileText size={size} className="text-blue-600" aria-hidden />;
    case 'image':
      return <ImageIcon size={size} className="text-emerald-600" aria-hidden />;
    case 'pdf':
      return <FileType size={size} className="text-red-600" aria-hidden />;
    default: {
      const ext = getFileExtension(name).toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(ext))
        return <FileSpreadsheet size={size} className="text-emerald-600" aria-hidden />;
      if (['zip', 'rar', '7z'].includes(ext))
        return <Archive size={size} className="text-amber-600" aria-hidden />;
      if (['mp4', 'mov'].includes(ext))
        return <Film size={size} className="text-purple-600" aria-hidden />;
      return <FileText size={size} className="text-slate-500" aria-hidden />;
    }
  }
}
