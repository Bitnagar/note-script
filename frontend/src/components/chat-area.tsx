import { useState, useRef, type ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
// import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User } from 'lucide-react';
import type { ChatMessage } from './rag-interface';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getMessages } from '@/services/getMessages';
import MultiStateCard from './multi-state-card';

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatAreaProps {
  selectedDocument: Document | null;
  documents: Document[] | undefined;
  isPDFViewerOpen?: boolean;
  isFileUploading?: boolean;
  onCitationClick: (page: string) => void;
}

export function ChatArea({
  selectedDocument,
  documents,
  isPDFViewerOpen,
  isFileUploading,
  onCitationClick,
}: ChatAreaProps) {
  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['messages', selectedDocument?.id],
    queryFn: () => getMessages(selectedDocument?.id),
    enabled: !!selectedDocument?.id,
  });
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = useAuthStore.getState().token;
    if (!token) {
      alert('Authentication error. Please log in again.');
      return;
    }
    if (!input.trim() || !selectedDocument) return;
    sendMessageMutation.mutate(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    []
  );

  const allMessages =
    optimisticMessages.length > 0
      ? [...(messages || []), ...optimisticMessages]
      : messages || [];

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const token = useAuthStore.getState().token;
      if (!token || !selectedDocument) throw new Error('Not authenticated');
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        createdAt: new Date(),
        document: selectedDocument,
        documentId: selectedDocument.id,
      };
      setOptimisticMessages((prev) => [...prev, userMessage]);
      // Add a placeholder for the AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '',
        timestamp: new Date().toISOString(),
        createdAt: new Date(),
        document: selectedDocument,
        documentId: selectedDocument.id,
      };
      setOptimisticMessages((prev) => [...prev, aiMessage]);

      // Streaming fetch
      const response = await fetch(
        `https://note-script.onrender.com/api/documents/${selectedDocument.id}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: content }),
        }
      );
      if (!response.ok || !response.body) {
        throw new Error('Failed to get a streaming response from the server.');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const decodedChunk = decoder.decode(value, { stream: true });
        const lines = decodedChunk.split('\n');
        const chunks = lines
          .map((line) => line.replace(/^data: /, '').trim())
          .filter((line) => line !== '' && line !== '[DONE]')
          .map((line) => JSON.parse(line));
        for (const chunk of chunks) {
          if (chunk.text) {
            aiContent += chunk.text;
            setOptimisticMessages((prev) => {
              // Update the last AI message
              const updated = [...prev];
              const lastIdx = updated.findIndex(
                (m) => m.role === 'ai' && m.id === aiMessage.id
              );
              if (lastIdx !== -1) {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: aiContent,
                };
              }
              return updated;
            });
          }
        }
      }
    },
    onError: (error) => {
      setOptimisticMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: 'err-' + Date.now(),
          role: 'ai',
          content:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred.',
          timestamp: new Date().toISOString(),
          createdAt: new Date(),
          document: selectedDocument!,
          documentId: selectedDocument?.id || '',
        },
      ]);
    },
  });

  const MessageWithCitations = ({
    text,
    onCitationClick,
  }: {
    text: string;
    onCitationClick: (page: string) => void;
  }): ReactElement => {
    const parts = text.split(/(\[Page \d+\])/g);
    return (
      <p>
        {parts.map((part, index) => {
          const match = part.match(/\[Page (\d+)\]/);
          if (match) {
            const pageNum = match[1];
            return (
              <Button
                size="sm"
                key={index}
                className="rounded-full text-xs w-4 h-4 p-1 bg-slate-400 cursor-pointer"
                onClick={() => onCitationClick(pageNum)}
              >
                {pageNum}
              </Button>
            );
          }
          return part;
        })}
      </p>
    );
  };

  return (
    <div
      className={cn('flex flex-col', {
        'flex-1': !isPDFViewerOpen,
        'w-1/2': isPDFViewerOpen,
      })}
    >
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto h-[calc(100vh-24vh)] relative pb-4 real-scroll-container">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {allMessages?.map((message) => (
              <div key={message.id} className="flex gap-3 sm:gap-4">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 mt-1">
                  <AvatarFallback
                    className={
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }
                  >
                    {message.role === 'user' ? (
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {message.role === 'user' ? 'You' : 'RAG Assistant'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <Card
                    className={` ${
                      message.role === 'user' ? 'bg-primary/5' : 'bg-muted/30'
                    } py-2`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <MessageWithCitations
                        text={message.content}
                        onCitationClick={onCitationClick}
                      />
                      {/* <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p> */}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
            <MultiStateCard
              isLoading={isLoading || isFileUploading}
              documents={documents}
              messages={allMessages}
              selectedDocument={selectedDocument}
            />
          </div>
        </div>
      </ScrollArea>

      <div className="border-t p-3 sm:p-4 bg-background sticky bottom-0 left-0 right-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  documents?.length && documents?.length > 0
                    ? 'Ask a question about your documents...'
                    : 'Upload documents first to start asking questions'
                }
                className="min-h-[44px] max-h-[120px] resize-none pr-12 text-sm"
                disabled={documents?.length === 0}
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 bottom-2 h-8 w-8 shrink-0"
                disabled={!input.trim() || documents?.length === 0}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center px-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}

{
  /* {message.citations && message.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Citations:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {message.citations.map((citation) => (
                              <Button
                                key={citation.id}
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs gap-1 hover:bg-primary/10 bg-transparent"
                                // onClick={() => onCitationClick(citation)}
                              >
                                <FileText className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {citation.documentName}
                                </span>
                                <span className="text-muted-foreground">
                                  p.{citation.pageNumber}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )} */
}

{
  /* {message.sources &&
                        message.sources.length > 0 &&
                        !message.citations && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Sources:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {message.sources.map((source, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs gap-1 max-w-full"
                                >
                                  <FileText className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{source}</span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )} */
}
