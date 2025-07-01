import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
   const location = useLocation();
  if (location.pathname === "/") return null;

  return (
    <>
      <div className="header">
        <div className="header-left">
          {/* <button
            className="back-btn"
           onClick={() => navigate('/', { state: { view: 'ocr' } })}>
            ← Back to Queue
          </button> */}
          <div className="invoice-info">
            <strong>INV-2024-001</strong> | Tata Steel Ltd | ₹2,45,600
          </div>
        </div>
        <div className="header-right">
          <div className="confidence-indicator">
            <span>AI Confidence:</span>
            <span style={{ color: "#e74c3c", fontWeight: "bold" }}>45%</span>
          </div>
          <span>Invoice 1 of 136</span>
          <span className="timer">Time: 00:00:00</span>
        </div>
      </div>

      <style>{`
        .header {
          background: #2c3e50;
          color: white;
          padding: 8px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .back-btn {
          background: #34495e;
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .invoice-info {
          font-size: 14px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 12px;
        }
        .confidence-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #34495e;
          padding: 4px 8px;
          border-radius: 4px;
        }
      `}</style>
    </>
  );
};

export default Header;
