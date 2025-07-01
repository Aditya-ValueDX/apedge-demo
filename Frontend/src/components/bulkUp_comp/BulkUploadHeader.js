import React from 'react';

const BulkUploadHeader = () => {
  return (
    <>
      <div className="header">
        <div className="logo-section">
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>APAuto Pro</div>
          <select className="plant-selector">
            <option>Plant A - Mumbai</option>
            <option>Plant B - Pune</option>
            <option>Plant C - Chennai</option>
          </select>
        </div>
        <div className="user-info">
          <span>Priya Sharma - AP Clerk</span>
          <span>|</span>
          <span>📧 Email Monitor: Active</span>
          <button className="back-btn">Back to Dashboard</button>
        </div>
      </div>

      <style>{`
        .header {
          background: #2c3e50;
          color: white;
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .plant-selector {
          background: #34495e;
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 14px;
        }
        .back-btn {
          background: #34495e;
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </>
  );
};

export default BulkUploadHeader;