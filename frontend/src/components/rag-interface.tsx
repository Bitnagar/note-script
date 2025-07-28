import { useState } from 'react';
import { Header } from './header';
import { DocumentSidebar } from './document-sidebar';
import { ChatArea } from './chat-area';
import { UploadModal } from './upload-modal';
import { PDFViewerNew } from './pdf-viewer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Document } from '@/pages/DashboardPage';
import { getDocs } from '@/services/getDocs';
import apiClient from '@/api';
import { deleteDoc } from '@/services/deleteDoc';
import { toast } from 'sonner';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useFileUrlStore } from '@/store';
// Add to existing interfaces
export interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  text: string;
}

// Update ChatMessage interface to include citations
export interface ChatMessage {
  sources?: string[];
  timestamp: string;
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: Date;
  document: Document;
  documentId: string;
}

export function RAGInterface() {
  const { fileFromSupabase, setFileFromSupabase } = useFileUrlStore();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [isFileUploading, setIsFileUploading] = useState(false);
  const { data: documents } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: getDocs,
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);

  const handleUploadDocuments = async (files: File[]) => {
    setIsUploadModalOpen(false);
    for (const file of files) {
      const formData = new FormData();
      formData.append('pdf', file);
      try {
        setIsFileUploading(true);
        const response = await apiClient.post('/api/upload', formData);
        if (response.status === 200) {
          queryClient.invalidateQueries({ queryKey: ['documents'] });
          setIsFileUploading(false);
        } else {
          setIsFileUploading(false);
          console.error('Upload failed:', response.data);
        }
      } catch (error) {
        setIsFileUploading(false);
        console.error('Upload failed', error);
      }
    }
  };

  const queryClient = useQueryClient();
  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => deleteDoc(docId),
    onSuccess: () => {
      setIsPDFViewerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDocument(null);
      toast('Document has been deleted.', {
        icon: <CheckCircle className="h-4 w-4" />,
        position: 'top-center',
      });
    },
  });

  const handleDeleteDocument = async (docId: string) => {
    toast('Deleting doc. Please wait...', {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      position: 'top-center',
    });
    deleteDocMutation.mutate(docId);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        isFileUploading={isFileUploading}
        onUpload={() => setIsUploadModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay for sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Mobile overlay for PDF viewer */}
        {isPDFViewerOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsPDFViewerOpen(false)}
          />
        )}

        <DocumentSidebar
          isFileUploading={isFileUploading}
          documents={documents}
          isOpen={isSidebarOpen}
          onDeleteDocument={handleDeleteDocument}
          onUpload={() => setIsUploadModalOpen(true)}
          onClose={closeSidebar}
          onDocumentSelect={(doc) => {
            setSelectedDocument(doc);
            setCurrentPage(1);
            setIsPDFViewerOpen(true);
            setFileFromSupabase(
              `https://ppoxrhnpenemzjmvyviv.supabase.co/storage/v1/object/public/rag-test/${doc.userId}/${doc.fileName}`
            );
          }}
        />

        <div className="flex flex-1 overflow-hidden">
          <ChatArea
            selectedDocument={selectedDocument}
            documents={documents}
            isPDFViewerOpen={isPDFViewerOpen}
            isFileUploading={isFileUploading}
            onCitationClick={(page) => {
              setCurrentPage(Number(page));
              setIsPDFViewerOpen(true);
              console.log(page);
            }}
          />
          {selectedDocument && isPDFViewerOpen && (
            <PDFViewerNew
              document={selectedDocument}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              isOpen={isPDFViewerOpen}
              onClose={() => {
                setIsPDFViewerOpen(false);
                // setSelectedDocument(null);
              }}
              fileUrl={fileFromSupabase}
            />
          )}
        </div>
      </div>
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadDocuments}
      />
    </div>
  );
}
