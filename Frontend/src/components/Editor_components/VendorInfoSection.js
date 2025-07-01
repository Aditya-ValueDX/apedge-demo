import React from 'react';

const VendorInfoSection = () => {
  return (
    <>
      <div className="section">
  <div className="section-header">
    <span>🏢 Vendor Information</span>
    {/* <span className="confidence-badge conf-high">95% Confident</span> */}
  </div>
  <div className="section-content">
    <div className="form-row">
      <div className="form-group">
        <label className="form-label">
          Vendor Name <span className="required">*</span>
        </label>
        <div className="auto-suggest">
          <input type="text" className="form-input success" defaultValue="Tata Steel Limited" />
          <div className="suggest-dropdown">
            <div className="suggest-item">Tata Steel Limited</div>
            <div className="suggest-item">Tata Steel Ltd</div>
            <div className="suggest-item">TATA STEEL LTD</div>
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">
          GSTIN <span className="required">*</span>
        </label>
        <input type="text" className="form-input success" defaultValue="20AAACT2727Q1ZM" />
      </div>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label className="form-label">Vendor Code</label>
        <input type="text" className="form-input" defaultValue="V001234" readOnly />
      </div>
      <div className="form-group">
        <label className="form-label">Payment Terms</label>
        <select className="form-input">
          <option>NET 30</option>
          <option>NET 15</option>
          <option>NET 60</option>
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

export default VendorInfoSection;
