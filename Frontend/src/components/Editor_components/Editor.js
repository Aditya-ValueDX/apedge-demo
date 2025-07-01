import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JsonForms } from '@jsonforms/react';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import { ValidationMode } from '@jsonforms/core';
import '../styles/Editor.css';

const Editor = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [ocrData, setOcrData] = useState(null);
  const [invoicePath, setInvoicePath] = useState('');
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState(null);
  const [uiSchema, setUiSchema] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ocrRes = await fetch('http://localhost:5000/api/ocr-results');
        const ocrAll = await ocrRes.json();
        const matchOCR = ocrAll.find(item => item.invoiceId == invoiceId);
        if (matchOCR) {
          // Normalize keys in OCR data to match schema keys
          const normalized = {};
          for (const key in matchOCR.ocrData) {
            const normalizedKey = key.trim().replace(/\s+/g, '_');
            normalized[normalizedKey] = matchOCR.ocrData[key];
          }
          setOcrData(normalized);
        }


        const invRes = await fetch('http://localhost:5000/api/invoices');
        const invoices = await invRes.json();
        const invoice = invoices.find(item => item.id == invoiceId);
        if (invoice) setInvoicePath(invoice.filePath);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    // Inside useEffect
    const fetchSchema = async () => {
      const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      const userId = storedUser.id || 'defaultUserId'; // fallback if not found

      try {
        const res = await fetch(`http://localhost:5000/api/form-fields/${userId}`);
        const { schema, uiSchema } = await res.json();
        setSchema(schema);
        setUiSchema(uiSchema);
      } catch (error) {
        console.error('Error fetching form schema:', error);
      }
    };

    fetchSchema();
    fetchData();
  }, [invoiceId]);

  const handleChange = (field, value) => {
    setOcrData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    try {
      await fetch(`http://localhost:5000/api/ocr/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: true, updates: ocrData }),
      });
      alert('Draft saved!');
    } catch (error) {
      alert('Failed to save draft.');
    }
  };

  const handleApprove = async () => {
    try {
      await fetch(`http://localhost:5000/api/reconcile/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ocrData, approved: true }),
      });
      alert('Invoice approved!');
      navigate('/match');
    } catch (error) {
      alert('Failed to approve.');
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return alert("Rejection reason is required.");
    try {
      await fetch(`http://localhost:5000/api/ocr/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejected: true, rejectionReason: reason, updates: ocrData }),
      });
      alert('Invoice rejected.');
      navigate('/ocr');
    } catch (error) {
      alert('Failed to reject.');
    }
  };

  const renderInvoicePreview = () => {
    const fileUrl = `http://localhost:5000/${invoicePath?.replace(/\\/g, '/')}`;
    const ext = invoicePath?.split('.').pop().toLowerCase();
    if (!ext) return <p>No file found</p>;
    if (ext === 'pdf') return <iframe src={fileUrl} title="Invoice" className="invoice-preview" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return <img src={fileUrl} alt="Invoice" className="invoice-preview" />;
    return <a href={fileUrl} target="_blank">Download</a>;
  };

  if (loading) return <div className="editor-loading">Loading invoice data...</div>;
  if (!ocrData) return <div className="editor-error">OCR data not found for invoice #{invoiceId}</div>;

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')         // from camelCase → camel Case
      .replace(/_/g, ' ')                 // from snake_case → snake case
      .replace(/\b\w/g, l => l.toUpperCase()); // capitalize words
  };

  return (
    <div className="editor-container">
      <div className="editor-left">{renderInvoicePreview()}</div>

      <div className="editor-right">
        <h2 className="editor-title">Invoice Editor</h2>

        <div className="editor-scroll">
          <div className="jsonforms-container">
            {schema && uiSchema ? (
              <JsonForms
                schema={schema}
                uischema={uiSchema}
                data={ocrData}
                renderers={materialRenderers}
                cells={materialCells}
                validationMode="ValidateAndShow" // ✅ string value instead of enum
                onChange={({ data }) => setOcrData(data)}
              />

            ) : (
              <p>Loading form fields...</p>
            )}
          </div>

          {ocrData.items?.length > 0 && (
            <>
              <h3 className="items-heading">Items</h3>
              <div className="items-wrapper">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Serial</th>
                      <th>Description</th>
                      <th>HSN</th>
                      <th>Item Code</th>
                      <th>UOM</th>
                      <th>Quantity</th>
                      <th>Rate</th>
                      <th>Taxable Value</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocrData.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.serial}</td>
                        <td>{item.description}</td>
                        <td>{item.hsn}</td>
                        <td>{item.itemCode}</td>
                        <td>{item.uom}</td>
                        <td>{item.quantity}</td>
                        <td>{item.rate}</td>
                        <td>{item.taxableValue}</td>
                        <td>{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>


        <div className="editor-actions">
          <button className="btn reject" onClick={handleReject}>Reject</button>
          <button className="btn draft" onClick={handleSaveDraft}>Save Draft</button>
          <button className="btn approve" onClick={handleApprove}>Approve & Send</button>
        </div>
      </div>
    </div>
  );
};

export default Editor;
