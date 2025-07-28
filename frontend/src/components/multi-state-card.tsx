import { Bot } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import type { Document } from '@/pages/DashboardPage';
import type { ChatMessage } from './rag-interface';

type Props = {
  isLoading: boolean | undefined;
  documents: Document[] | undefined;
  selectedDocument: Document | null;
  messages: ChatMessage[] | undefined;
};

export default function MultiStateCard({
  isLoading,
  documents,
  selectedDocument,
  messages,
}: Props) {
  return (
    <>
      {!isLoading &&
        documents !== undefined &&
        documents.length > 0 &&
        messages?.length === 0 &&
        !selectedDocument && (
          <CustomCard
            isLoading={isLoading}
            heading="Select a document from the sidebar to get started."
            subheading="You have no active conversations yet."
          />
        )}
      {!isLoading && documents?.length === 0 && !selectedDocument && (
        <CustomCard
          isLoading={isLoading}
          heading="Ready to analyze your documents"
          subheading="Upload some documents to get started with intelligent Q&A"
        />
      )}
      {isLoading && documents?.length === 0 && (
        <CustomCard
          isLoading={isLoading}
          heading="Uploading..."
          subheading="Uploading and processing your documents. Please wait..."
        />
      )}
      {!isLoading && selectedDocument && messages && messages?.length < 1 && (
        <CustomCard
          isLoading={isLoading}
          heading="Start chatting with your document!"
          subheading="You can now ask questions about your document."
        />
      )}
    </>
  );
}

function CustomCard({
  isLoading,
  heading,
  subheading,
}: {
  isLoading: boolean | undefined;
  heading: string;
  subheading: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-6 sm:p-8 text-center">
        <Bot
          className={`h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4 ${
            isLoading ? 'animate-bounce' : ''
          }`}
        />
        <h3 className="font-medium mb-2 text-sm sm:text-base">{heading}</h3>
        <p className="text-sm text-muted-foreground">{subheading}</p>
      </CardContent>
    </Card>
  );
}
