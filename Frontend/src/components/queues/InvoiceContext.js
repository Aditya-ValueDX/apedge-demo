import React, { createContext, useState } from 'react';
import extractionData from './ExtractionQueue_data';

export const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
  const [extractionList, setExtractionList] = useState(extractionData);
  const [reconList, setReconList] = useState([]);
  const [rejectedCount, setRejectedCount] = useState(0);

  const submitInvoice = (id) => {
    const invoice = extractionList.find(item => item.id === id);
    if (invoice) {
      setExtractionList(prev => prev.filter(item => item.id !== id));
      setReconList(prev => [...prev, { ...invoice, status: 'queued for matching' }]);
    }
  };

  const rejectInvoice = (id) => {
    const exists = extractionList.find(item => item.id === id);
    if (exists) {
      setExtractionList(prev => prev.filter(item => item.id !== id));
      setRejectedCount(prev => prev + 1);
    }
  };

  return (
    <InvoiceContext.Provider value={{
      extractionList,
      reconList,
      rejectedCount,
      submitInvoice,
      rejectInvoice
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};
