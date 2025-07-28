import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from './ui/button';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  fileUrl: string | null;
  pageNumber: number;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  fileUrl,
  pageNumber,
  setPageNumber,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  // const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on new doc load
  };

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  };

  const previousPage = () => {
    if (pageNumber > 1) {
      changePage(-1);
    }
  };

  const nextPage = () => {
    if (numPages && pageNumber < numPages) {
      changePage(1);
    }
  };

  if (!fileUrl) {
    return (
      <div className="pdf-placeholder">
        Select a document to view its content.
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full relative">
      <div className="flex gap-2 items-center justify-between mb-4 p-2 sticky top-0 bg-white z-10">
        <Button
          className="cursor-pointer"
          type="button"
          disabled={pageNumber <= 1}
          onClick={previousPage}
        >
          ‹ Prev
        </Button>
        <span>
          Page {pageNumber} of {numPages || '--'}
        </span>
        <Button
          className="cursor-pointer"
          type="button"
          disabled={!numPages || pageNumber >= numPages}
          onClick={nextPage}
        >
          Next ›
        </Button>
      </div>
      <div className="pdf-document-wrapper">
        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} />
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
