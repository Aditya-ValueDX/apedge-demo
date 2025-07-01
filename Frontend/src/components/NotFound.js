import React from 'react';
import { XCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="status-container">
      <div className="icon-wrapper">
        <XCircle size={60} color="#e74c3c" />
      </div>
      <h1 className="status-title">404 - Page Not Found</h1>
      <p className="status-text">Sorry, the page you're looking for doesn't exist.</p>

      <style>{`
        .status-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          text-align: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
        }

        .icon-wrapper {
          margin-bottom: 20px;
        }

        .status-title {
          font-size: 28px;
          color: #2c3e50;
          margin-bottom: 8px;
        }

        .status-text {
          font-size: 16px;
          color: #7f8c8d;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
