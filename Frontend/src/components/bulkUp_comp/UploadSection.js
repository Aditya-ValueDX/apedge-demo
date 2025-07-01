import React from 'react';
import { FolderUp, MailPlus } from 'lucide-react';

const UploadSection = () => {
  return (
    <>
      <div className="upload-section">
        <div className="upload-methods">
          <div className="upload-card">
            <FolderUp className="upload-icon" />
            <div className="upload-title">Manual File Upload</div>
            <div className="upload-desc">
              Upload individual invoices or bulk files from your computer.
              Supports PDF, JPG, PNG, TIFF formats.
            </div>
          </div>

          <div className="upload-card">
            <MailPlus className="upload-icon" />
            <div className="upload-title">Email Processing</div>
            <div className="upload-desc">
              View and process invoices received via email attachments.
              Auto-monitoring enabled for designated email accounts.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .upload-section {
          padding: 32px 24px;
          background: #f8f9fc;
        }

        .upload-methods {
          display: flex;
          gap: 24px;
          justify-content: center;
          align-items: stretch;
          flex-wrap: wrap;
        }

        .upload-card {
          flex: 1;
          min-width: 280px;
          max-width: 480px;
          background: #ffffff;
          border-radius: 10px;
          padding: 28px 24px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          border: 1.5px solid #dee2e6;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .upload-card:hover {
          border-color: #495057;
          background: #fcfcfc;
          transform: translateY(-2px);
        }

        .upload-icon {
          font-size: 40px;
          color: #6c757d;
          margin-bottom: 16px;
        }

        .upload-title {
          font-size: 18px;
          font-weight: 600;
          color: #343a40;
          margin-bottom: 10px;
        }

        .upload-desc {
          font-size: 13px;
          color: #6c757d;
          line-height: 1.5;
        }
      `}</style>
    </>
  );
};

export default UploadSection;
