import React from 'react';
import { Document, Page } from 'react-pdf';
import { useState } from 'react';

const DocumentViewer = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState(null);

  return fileUrl.endsWith('.pdf') ? (
    <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
      {Array.from(new Array(numPages), (_, i) => (
        <Page key={i + 1} pageNumber={i + 1} />
      ))}
    </Document>
  ) : (
    <img src={fileUrl} alt="Invoice" style={{ maxWidth: '100%' }} />
  );
};


export default DocumentViewer;