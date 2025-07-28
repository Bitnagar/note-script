import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Loader2,
  LogOut,
  MoreVertical,
  Settings,
  Trash2,
  Upload,
  UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useAuthStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import type { DocumentType } from '@/types/shared';

interface DocumentSidebarProps {
  documents: DocumentType[] | undefined;
  isOpen: boolean;
  onDeleteDocument: (id: string) => void;
  onUpload: () => void;
  onClose?: () => void;
  onDocumentSelect: (document: DocumentType) => void;
  isFileUploading?: boolean;
}

export function DocumentSidebar({
  documents,
  isOpen,
  onDeleteDocument,
  onUpload,
  onClose,
  onDocumentSelect,
  isFileUploading,
}: DocumentSidebarProps) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-background border-r transition-all duration-300 z-50',
        // Mobile: fixed overlay
        'fixed inset-y-0 left-0 w-80 max-w-[85vw]',
        // Desktop: normal sidebar
        'md:relative md:inset-auto md:w-80 md:max-w-none',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        !isOpen && 'md:w-0 md:overflow-hidden'
      )}
    >
      <div className="p-3 sm:p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm sm:text-base">Knowledge Base</h2>
          <Badge variant="secondary" className="text-xs">
            {documents?.length} docs
          </Badge>
        </div>
        <Button
          onClick={() => {
            onUpload();
            onClose?.();
          }}
          variant="outline"
          className="w-full gap-2 bg-transparent h-9 text-sm"
        >
          {isFileUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Add Documents
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 space-y-3">
          {documents?.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground px-2">
                No documents uploaded yet
              </p>
            </div>
          ) : (
            documents?.map((doc) => (
              <Card
                key={doc.id}
                className="group hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => onDocumentSelect(doc)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-medium text-sm truncate"
                        title={doc.fileName}
                      >
                        {doc.fileName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {'pdf'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {'NA'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(doc.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-3 sm:p-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {'user.avatar'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" title={'user.name'}>
              {/* {user.name} */}
            </p>
            <p
              className="text-xs text-muted-foreground truncate"
              title={'user.email'}
            >
              {'user.email'}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2">
                <UserIcon className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
