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
  document: DocumentType;
  documentId: string;
}

export interface DocumentType {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  fileName?: string;
  userId?: string;
}
