import React from 'react';
import ActionBar from './ActionBar';
import VendorInfoSection from './VendorInfoSection';
import InvoiceHeaderSection from './InvoiceHeaderSection'
import LineItemsSection from './LineItemsSection'
import TotalsSection from './TotalsSection'
// Inside return:

const DataEditor = ({ extractedData = {}, onChange, onSubmit }) => {
  return (
    <div>
      <h3>Extracted Data</h3>
      {Object.entries(extractedData).map(([key, value], idx) => (
        <div key={idx}>
          <label>{key}:</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
          />
        </div>
      ))}
      <button onClick={onSubmit}>Save</button>
    </div>
  );
};

export default DataEditor;