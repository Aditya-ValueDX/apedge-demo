import React from 'react';

const LineItemsSection = () => {
  return (
    <>
     <div className="section">
  <div className="section-header">
    <span>📋 Line Items</span>
  </div>
  <div className="section-content">
    <table className="line-items-table">
      <thead>
        <tr>
          <th style={{ width: '250px' }}>Description</th>
          <th style={{ width: '80px' }}>Quantity</th>
          <th style={{ width: '100px' }}>Unit Price</th>
          <th style={{ width: '100px' }}>Amount</th>
          <th style={{ width: '80px' }}>Tax %</th>
          <th style={{ width: '40px' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><input type="text" defaultValue="Steel Plates - Grade A" className="form-input success" /></td>
          <td><input type="number" defaultValue="100" className="form-input success" /></td>
          <td><input type="number" defaultValue="2000.00" className="form-input success" /></td>
          <td><input type="number" defaultValue="200000.00" className="form-input success" readOnly /></td>
          <td><input type="number" defaultValue="18" className="form-input success" /></td>
          <td><button className="delete-line-btn">×</button></td>
        </tr>
      </tbody>
    </table>
    <button className="add-line-btn">+ Add Line Item</button>
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

export default LineItemsSection;
