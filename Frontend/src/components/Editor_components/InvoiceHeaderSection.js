import React from 'react';

const InvoiceHeaderSection = () => {
  return (
    <>
      <div className="section">
  <div className="section-header">
    <span>📄 Invoice Header</span>
    {/* <span className="confidence-badge conf-low">45% Confident</span> */}
  </div>
  <div className="section-content">
    <div className="form-row">
      <div className="form-group">
        <label className="form-label">
          Invoice Number <span className="required">*</span>
          {/* <span className="confidence-badge conf-high">92%</span> */}
        </label>
        <input type="text" className="form-input success" defaultValue="INV-2024-001" />
      </div>
      <div className="form-group">
        <label className="form-label">
          Invoice Date <span className="required">*</span>
          {/* <span className="confidence-badge conf-low">35%</span> */}
        </label>
        <input type="date" className="form-input error" defaultValue="2024-03-15" />
        <div className="error-message">Date format was unclear in OCR - please verify</div>
        <div className="suggestion-box">
          {/* <div className="suggestion-title">AI Suggestions:</div>
          <div className="suggestion-item">15/03/2024</div>
          <div className="suggestion-item">05/03/2024</div> */}
        </div>
      </div>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label className="form-label">
          PO Number
          {/* <span className="confidence-badge conf-high">88%</span> */}
        </label>
        <input type="text" className="form-input success" defaultValue="PO-2024-456" />
      </div>
      <div className="form-group">
        <label className="form-label">Due Date</label>
        <input type="date" className="form-input" defaultValue="2024-04-15" />
      </div>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label className="form-label">
          Business Unit <span className="required">*</span>
        </label>
        <select className="form-input warning">
          <option value="">-- Select Business Unit --</option>
          <option value="PLANT-A-MUM">Plant A - Mumbai</option>
          <option value="PLANT-B-PUN">Plant B - Pune</option>
          <option value="PLANT-C-CHE">Plant C - Chennai</option>
          <option value="HO-MUM">Head Office - Mumbai</option>
        </select>
        <div className="error-message">Required field - could not auto-detect</div>
      </div>
      <div className="form-group">
        <label className="form-label">
          Invoice Type <span className="required">*</span>
        </label>
        <select className="form-input success">
          <option value="PURCHASE" selected>Purchase Invoice</option>
          <option value="SERVICE">Service Invoice</option>
          <option value="UTILITY">Utility Bill</option>
          <option value="EXPENSE">Expense</option>
        </select>
      </div>
    </div>
  </div>
</div>


      <style>{`
        .section {
          background: white;
          border: 1px solid #e0e6ed;
          border-radius: 6px;
          margin-bottom: 15px;
          overflow: hidden;
        }
        .section-header {
          background: #f8f9fa;
          padding: 10px 15px;
          border-bottom: 1px solid #e0e6ed;
          font-weight: bold;
          font-size: 13px;
          color: #2c3e50;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .section-content {
          padding: 15px;
        }
        .confidence-badge {
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 2px;
          font-weight: bold;
          background: #f0f0f0;
        }
      `}</style>
    </>
  );
};

export default InvoiceHeaderSection;
