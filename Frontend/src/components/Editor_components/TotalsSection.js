import React from 'react';

const TotalsSection = () => {
  return (
    <>
      <div className="section">
        <div className="section-header">
          <span>💰 Totals & Tax</span>
        </div>
        <div className="section-content">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Subtotal</label>
              <input type="number" className="form-input success" defaultValue="200000.00" readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">CGST (9%)</label>
              <input type="number" className="form-input success" defaultValue="18000.00" readOnly />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">SGST (9%)</label>
              <input type="number" className="form-input success" defaultValue="18000.00" readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">
                Total Amount <span className="required">*</span>
              </label>
              <input type="number" className="form-input error" defaultValue="245600.00" />
              <div className="error-message">
                OCR detected: ₹2,45,600 but calculated: ₹2,56,000
              </div>
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
        }
        .conf-low {
          background: #f8d7da;
          color: #721c24;
        }
        .form-row {
          display: flex;
          gap: 15px;
          margin-bottom: 12px;
          align-items: flex-start;
        }
        .form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .form-label {
          font-size: 11px;
          font-weight: bold;
          color: #555;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .required {
          color: #e74c3c;
        }
        .form-input {
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          background: white;
        }
        .form-input.success {
          border-color: #27ae60;
          background: #f0fff4;
        }
        .form-input.error {
          border-color: #e74c3c;
          background: #fef2f2;
        }
        .error-message {
          font-size: 10px;
          color: #e74c3c;
          margin-top: 2px;
        }
      `}</style>
    </>
  );
};

export default TotalsSection;
