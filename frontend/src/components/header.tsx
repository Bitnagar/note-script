import { Button } from '@/components/ui/button';
import { Brain, Loader2, Menu, Upload, X } from 'lucide-react';

interface HeaderProps {
  onUpload: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isFileUploading?: boolean;
}

export function Header({
  onUpload,
  onToggleSidebar,
  isSidebarOpen,
  isFileUploading,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-3 sm:px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="shrink-0 h-9 w-9"
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary shrink-0">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold truncate">
              Note Script
            </h1>
            <p className="text-xs text-muted-foreground hidden lg:block">
              Intelligent document analysis and Q&A
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button onClick={onUpload} className="gap-2 h-9 px-3 sm:px-4">
          {isFileUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="hidden xs:inline">Upload</span>
          <span className="hidden sm:inline">Documents</span>
        </Button>
      </div>
    </header>
  );
}
