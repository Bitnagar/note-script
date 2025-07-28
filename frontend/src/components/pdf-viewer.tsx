import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, FileText } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Document } from '@/pages/DashboardPage';
import PdfViewer from './PdfViewer';

interface PDFViewerProps {
  document: Document;
  currentPage: number;
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export function PDFViewerNew({
  document,
  isOpen,
  onClose,
  fileUrl,
  currentPage,
  setCurrentPage,
}: PDFViewerProps) {
  return (
    <div
      className={cn(
        'flex flex-col bg-background border-l transition-all duration-300',
        // Mobile: fixed overlay
        'fixed inset-y-0 right-0 w-full z-50',
        // Desktop: half screen
        'md:relative md:inset-auto md:w-1/2 md:z-auto',
        isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="font-medium text-sm truncate"
              title={document.fileName}
            >
              {document.fileName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {'NA'}
              </Badge>
              <span className="text-xs text-muted-foreground">{'NA'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* PDF Content */}
      <PdfViewer
        fileUrl={fileUrl}
        pageNumber={currentPage}
        setPageNumber={setCurrentPage}
      />
    </div>
  );
}
