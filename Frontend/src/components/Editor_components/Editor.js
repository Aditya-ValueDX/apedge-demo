import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, X, Check, ArrowRight, GripVertical, ChevronDown, ChevronRight
} from 'lucide-react';
import '../styles/Editor.css';
import { BASE_URL } from '../../config';

const Editor = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [ocrData, setOcrData] = useState(null);
  const [invoicePath, setInvoicePath] = useState('');
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState(null);
  const [formColumns, setFormColumns] = useState(2);
  // New state to hold a list of missing required fields
  const [missingFields, setMissingFields] = useState(new Set());

  // State for section collapsibility
  const [isBuyerDetailsCollapsed, setIsBuyerDetailsCollapsed] = useState(false);
  const [isInvoiceDetailsCollapsed, setIsInvoiceDetailsCollapsed] = useState(false);
  const [isLineItemsCollapsed, setIsLineItemsCollapsed] = useState(false);
  const [isOtherDetailsCollapsed, setIsOtherDetailsCollapsed] = useState(false);
  const [isBankDetailsCollapsed, setIsBankDetailsCollapsed] = useState(false);

  // Refs for resizing
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const leftPanelRef = useRef(null);
  const formContainerRef = useRef(null);

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        const userId = storedUser.id || 'defaultUserId';

        const [ocrRes, invRes, schemaRes] = await Promise.all([
          fetch(`${BASE_URL}/api/ocr-results`),
          fetch(`${BASE_URL}/api/invoices`),
          fetch(`${BASE_URL}/api/form-fields/${userId}`)
        ]);

        if (!ocrRes.ok) throw new Error('Failed to fetch OCR results.');
        if (!invRes.ok) throw new Error('Failed to fetch invoices.');
        if (!schemaRes.ok) throw new Error('Failed to fetch schema.');

        const ocrAll = await ocrRes.json();
        const invoices = await invRes.json();
        const { schema: fetchedSchema } = await schemaRes.json();

        const matchOCR = ocrAll.find(item => String(item.invoiceId) === String(invoiceId));
        const invoice = invoices.find(item => String(item.id) === String(invoiceId));

        if (matchOCR) setOcrData(matchOCR.ocrData);
        if (invoice) setInvoicePath(invoice.filePath);
        if (fetchedSchema) setSchema(fetchedSchema);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        setOcrData(null);
        setInvoicePath('');
        setSchema(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [invoiceId]);

  // Effect to update the missing fields list whenever ocrData or schema changes
  useEffect(() => {
    if (!ocrData || !schema || !schema.required) {
      setMissingFields(new Set());
      return;
    }

    const newMissingFields = new Set();
    const isValueMissing = (value) => value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

    // Top-level fields check
    schema.required.forEach(fieldKey => {
      if (isValueMissing(ocrData[fieldKey])) {
        newMissingFields.add(fieldKey);
      }
    });

    // Line item fields check
    if (ocrData.items && Array.isArray(ocrData.items)) {
      ocrData.items.forEach((item, itemIndex) => {
        ['description', 'hsn', 'quantity', 'unit', 'rate', 'amount', 'serialNumbers'].forEach(fieldKey => {
          const valueToCheck = fieldKey === 'description' && item.name !== undefined ? item.name : item[fieldKey];
          if (isValueMissing(valueToCheck)) {
            newMissingFields.add(`${fieldKey}-${itemIndex}`);
          }
        });
      });
    }
    setMissingFields(newMissingFields);
  }, [ocrData, schema]);


  // Dynamic Column Layout based on form panel width
  useLayoutEffect(() => {
    const formPanel = formContainerRef.current;
    if (!formPanel) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        if (width > 900) {
          setFormColumns(3);
        } else if (width > 550) {
          setFormColumns(2);
        } else {
          setFormColumns(1);
        }
      }
    });
    resizeObserver.observe(formPanel);
    return () => resizeObserver.disconnect();
  }, []);

  // High-Performance Resizer Logic
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current || !leftPanelRef.current) return;
    requestAnimationFrame(() => {
      const containerRect = containerRef.current.getBoundingClientRect();
      let newLeftWidthPx = e.clientX - containerRect.left;
      const minWidthPx = 400;
      const maxWidthPx = containerRect.width - 450;
      const clampedWidthPx = Math.max(minWidthPx, Math.min(newLeftWidthPx, maxWidthPx));
      leftPanelRef.current.style.width = `${clampedWidthPx}px`;
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDividerMouseDown = (e) => { e.preventDefault(); setIsDragging(true); };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setOcrData(prevData => ({
      ...prevData,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleLineItemChange = (e, itemIndex, fieldKey) => {
    const { value: inputValue, type: inputType } = e.target;
    setOcrData(prevData => {
      const newItems = [...(prevData.items || [])];
      if (!newItems[itemIndex]) {
        newItems[itemIndex] = {};
      }
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        [fieldKey]: inputType === 'number' ? parseFloat(inputValue) : inputValue
      };
      return { ...prevData, items: newItems };
    });
  };

  // API Action Handlers
  const handleReject = async () => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return console.log("Rejection reason is required.");
    try {
      await fetch(`${BASE_URL}/api/ocr/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejected: true, rejectionReason: reason, updates: ocrData })
      });
      console.log('Invoice rejected.');
      navigate('/ocr');
    } catch (error) { console.error(error); console.log('Failed to reject.'); }
  };

  const handleSendToReconciliation = async () => {
    try {
      await fetch(`${BASE_URL}/api/ocr/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: true, updates: ocrData })
      });
      console.log('Invoice sent to Reconciliation!');
    } catch (error) { console.error(error); console.log('Failed to save draft.'); }
  };

  const handleApproveAndUpload = async () => {
    if (missingFields.size > 0) {
      // Use a simple alert-like message box since `alert()` is not allowed
      const missingFieldList = Array.from(missingFields).map(f => f.split('-')[0]).join(', ');
      console.log(`Please fill in all required fields before approving. Missing: ${missingFieldList}`);
      return;
    }

    try {
      await fetch(`${BASE_URL}/api/reconcile/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ocrData, approved: true })
      });
      console.log('Invoice approved & uploaded!');
      navigate('/match');
    } catch (error) { console.error(error); console.log('Failed to approve.'); }
  };

  const renderInvoicePreview = () => {
    if (!invoicePath) return <div className="placeholder-view"><FileText size={48} /><p>Invoice document not found</p></div>;
    const fileUrl = `${BASE_URL}/${invoicePath.replace(/\\/g, '/')}`;
    return <iframe src={fileUrl} title="Invoice Preview" className="invoice-iframe" />;
  };

  if (loading) return <div className="page-status-view"><div className="loading-spinner"></div><p>Loading Invoice...</p></div>;
  if (!ocrData || !schema) return <div className="page-status-view error"><X size={48} /><p>Could not load data for Invoice #{invoiceId}</p></div>;

  const toCamelCase = (str) => {
    return str
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\b\w/g, l => l.toUpperCase()) // Start-case
      .replace(/\s+/g, '')
      .replace(/^\w/, c => c.toLowerCase());
  };

const getInputFieldType = (fieldKey) => {
  const config = schema.properties && schema.properties[fieldKey];
  if (!config) return 'text';
  const type = config.type;
  const isDate = fieldKey.toLowerCase().includes('date');
  if (isDate) return 'date';
  return type === 'number' ? 'number' : 'text';
};


// Generic field renderer for non-table fields
const renderField = (label) => {
  const key = toCamelCase(label);
  const fieldValue = ocrData[key];

  const isRequired = schema.required && schema.required.includes(key);
  const isMissingForVisual = isRequired && (fieldValue === null || fieldValue === undefined || String(fieldValue).trim() === '');

  return (
    <div className={`form-field ${isMissingForVisual ? 'field-missing' : ''}`} key={key}>
      <label htmlFor={key}>
        {label} {isRequired && <span className="required-asterisk">*</span>}
      </label>
      <input
        type={getInputFieldType(key)}
        id={key}
        name={key}
        value={fieldValue || ''}
        onChange={handleInputChange}
        className={`custom-input ${isMissingForVisual ? 'field-empty' : ''}`}
      />
      {isMissingForVisual && <p className="required-message">This field is required.</p>}
    </div>
  );
};

// Specific renderer for table cells within line items
const renderTableCellInput = (item, itemIndex, label) => {
  const key = toCamelCase(label);
  const itemValue = (key === 'description' && item.name !== undefined)
    ? item.name
    : item[key];

  const isRequired = schema.required && schema.required.includes(key);
  const isMissingForVisual = isRequired && (itemValue === null || itemValue === undefined || String(itemValue).trim() === '');


  return (
    <td key={`${itemIndex}-${key}`} className={isMissingForVisual ? 'field-missing' : ''}>
      <input
        type={getInputFieldType(key)}
        id={`${key}-${itemIndex}`}
        name={`${key}-${itemIndex}`}
        value={itemValue || ''}
        onChange={(e) => handleLineItemChange(e, itemIndex, key)}
        className={`custom-input ${isMissingForVisual ? 'field-empty' : ''}`}
      />
      {isMissingForVisual && <p className="required-message">Required</p>}
    </td>
  );
};


// Define fields for each section based on typical invoice layout
const buyerDetailsFields = ["Name", "Address", "Gstin", "State", "State Code", "Contact Person"];
const invoiceDetailsFields = ["Invoice No", "Invoice Date", "Order No", "Order Date", "Payment Terms", "Eway Bill No", "Reference User", "Vehicle No", "Delivery Terms"];
const bankDetailsFields = ["Account Holder", "Bank Name", "Account No", "Branch", "Ifsc", "Swift Code"];
const otherDetailsFields = ["Udyam No", "Email", "Declarations", "Pan", "Amount In Words", "Tax In Words", "Taxable Value", "Total Tax", "Grand Total"];

// Line item fields for the table headers
const lineItemTableHeaders = ["Description", "Hsn", "Quantity", "Unit", "Rate", "Amount"];

// Filter fields to only include those present in the schema for the current user
const getFilteredFields = (fieldList) => fieldList.filter(label => schema.properties.hasOwnProperty(toCamelCase(label)));

const filteredBuyerFields = getFilteredFields(buyerDetailsFields);
const filteredInvoiceFields = getFilteredFields(invoiceDetailsFields);
const filteredBankFields = getFilteredFields(bankDetailsFields);
const filteredOtherFields = getFilteredFields(otherDetailsFields);
const filteredLineItemTableHeaders = getFilteredFields(lineItemTableHeaders);


// Determine if line item table should be shown (based on 'items' array)
const shouldShowLineItemsTable = ocrData.items && Array.isArray(ocrData.items) && ocrData.items.length > 0;

return (
  <div className="editor-page-container">
    {isDragging && <div className="drag-overlay" />}
    <div className="editor-split-view" ref={containerRef}>

      <div className="editor-panel preview-panel" ref={leftPanelRef}>
        <div className="panel-header dark-header">
          <h3 className="panel-title"><FileText size={16} /> Invoice Preview</h3>
          <div className="panel-badge id-badge">ID #{invoiceId}</div>
        </div>
        <div className="panel-content preview-content-area">
          {renderInvoicePreview()}
        </div>
      </div>

      <div className="editor-divider" onMouseDown={handleDividerMouseDown}>
        <div className="divider-handle">
          <GripVertical size={16} />
        </div>
      </div>

      <div className="editor-panel form-panel">
        <div ref={formContainerRef} className="form-wrapper">
          <div className="panel-header">
            <h3 className="panel-title">Invoice Details</h3>
          </div>
          <div className="panel-content form-content-area">

            {/* Section: Buyer Details */}
            {filteredBuyerFields.length > 0 && (
              <div className={`form-section ${isBuyerDetailsCollapsed ? 'collapsed' : ''}`}>
                <h4 onClick={() => setIsBuyerDetailsCollapsed(!isBuyerDetailsCollapsed)}>
                  {isBuyerDetailsCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  Buyer Details
                </h4>
                <div className={`section-content ${isBuyerDetailsCollapsed ? 'hidden' : ''}`}>
                  <div className={`general-fields-grid columns-${formColumns}`}>
                    {filteredBuyerFields.map(label => renderField(label))}
                  </div>
                </div>
              </div>
            )}

            {/* Section: Invoice Details (General Info) */}
            {filteredInvoiceFields.length > 0 && (
              <div className={`form-section ${isInvoiceDetailsCollapsed ? 'collapsed' : ''}`}>
                <h4 onClick={() => setIsInvoiceDetailsCollapsed(!isInvoiceDetailsCollapsed)}>
                  {isInvoiceDetailsCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  Invoice Information
                </h4>
                <div className={`section-content ${isInvoiceDetailsCollapsed ? 'hidden' : ''}`}>
                  <div className={`general-fields-grid columns-${formColumns}`}>
                    {filteredInvoiceFields.map(label => renderField(label))}
                  </div>
                </div>
              </div>
            )}

            {/* Line Items Table - Middle Position */}
            {shouldShowLineItemsTable && (
              <div className={`form-section line-items-section ${isLineItemsCollapsed ? 'collapsed' : ''}`}>
                <h4 onClick={() => setIsLineItemsCollapsed(!isLineItemsCollapsed)}>
                  {isLineItemsCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  Line Items
                </h4>
                <div className={`section-content ${isLineItemsCollapsed ? 'hidden' : ''}`}>
                  <div className="table-scroll-container">
                    <table className="line-items-table">
                      <thead>
                        <tr>
                          {filteredLineItemTableHeaders.map(label => (
                            <th key={label}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ocrData.items.map((item, index) => (
                          <tr key={`item-${index}`}>
                            {filteredLineItemTableHeaders.map(label => renderTableCellInput(item, index, label))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Other Details (Includes Totals) */}
            {filteredOtherFields.length > 0 && (
              <div className={`form-section ${isOtherDetailsCollapsed ? 'collapsed' : ''}`}>
                <h4 onClick={() => setIsOtherDetailsCollapsed(!isOtherDetailsCollapsed)}>
                  {isOtherDetailsCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  Totals & Other Information
                </h4>
                <div className={`section-content ${isOtherDetailsCollapsed ? 'hidden' : ''}`}>
                  <div className={`general-fields-grid columns-${formColumns}`}>
                    {filteredOtherFields.map(label => renderField(label))}
                  </div>
                </div>
              </div>
            )}

            {/* Section: Bank Details */}
            {filteredBankFields.length > 0 && (
              <div className={`form-section ${isBankDetailsCollapsed ? 'collapsed' : ''}`}>
                <h4 onClick={() => setIsBankDetailsCollapsed(!isBankDetailsCollapsed)}>
                  {isBankDetailsCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  Bank Details
                </h4>
                <div className={`section-content ${isBankDetailsCollapsed ? 'hidden' : ''}`}>
                  <div className={`general-fields-grid columns-${formColumns}`}>
                    {filteredBankFields.map(label => renderField(label))}
                  </div>
                </div>
              </div>
            )}

          </div>
          <div className="panel-footer">
            <button className="btn btn-destructive" onClick={handleReject}><X size={16} /> Reject</button>
            <div className="actions-right">
              <button className="btn btn-secondary" onClick={handleSendToReconciliation}><ArrowRight size={16} /> Approve & Send to Reconciliation</button>
              <button className="btn btn-primary" onClick={handleApproveAndUpload} disabled={missingFields.size > 0}><Check size={16} /> Approve & Upload</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default Editor;
