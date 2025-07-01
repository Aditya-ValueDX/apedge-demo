import React from 'react';

const ActionBar = () => {
  return (
    <>
      <div className="action-bar">
        <div className="quick-actions">
          <div className="quick-action"> Auto-correct</div>
          <div className="quick-action"> Validate PO</div>
          <div className="quick-action"> Check Duplicate</div>
        </div>
        <div className="action-buttons">
          {/* <button className="btn btn-danger"> Flag for Review</button> */}
          <button className="btn btn-warning"> Save Progress</button>
          {/* <button className="btn btn-secondary">⏭ Skip & Next</button> */}
          <button className="btn btn-primary"> Submit & Next</button>
        </div>
      </div>

      <style>{`
        .action-bar {
          background: white;
          border-top: 1px solid #e0e6ed;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .quick-actions {
          display: flex;
          gap: 8px;
          font-size: 11px;
        }
        .quick-action {
          padding: 4px 8px;
          background: #ecf0f1;
          border: 1px solid #bdc3c7;
          border-radius: 3px;
          cursor: pointer;
        }
        .quick-action:hover {
          background: #d5dbdb;
        }
        .action-buttons {
          display: flex;
          gap: 10px;
        }
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
        }
        .btn-primary {
          background: #27ae60;
          color: white;
        }
        .btn-secondary {
          background: #95a5a6;
          color: white;
        }
        .btn-warning {
          background: #f39c12;
          color: white;
        }
        .btn-danger {
          background: #e74c3c;
          color: white;
        }
      `}</style>
    </>
  );
};

export default ActionBar;