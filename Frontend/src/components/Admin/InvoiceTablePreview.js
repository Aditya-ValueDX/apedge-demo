import React from 'react';

const InvoiceTablePreview = ({ config }) => {
  if (!config || Object.keys(config).length === 0) {
    return <p>No table structure defined.</p>;
  }

  const headers = Object.keys(config);

  return (
    <div className="invoice-table-preview">
      <h3> Invoice Table Preview</h3>
      <table className="preview-table">
        <thead>
          <tr>
            {headers.map((key, idx) => (
              <th key={idx}>
                <div className="header-text">
                  {key} {config[key].required ? '*' : ''}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {headers.map((_, idx) => (
              <td key={idx}>---</td>
            ))}
          </tr>
        </tbody>
      </table>

      <style>{`
        .invoice-table-preview {
          margin: 30px auto;
          background: #ffffff;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          font-family: 'Segoe UI', sans-serif;
          max-width: 100%;
        }

        .invoice-table-preview h3 {
          font-size: 18px;
          margin-bottom: 16px;
          color: #2c3e50;
        }

        .preview-table {
          width: 100%;
          table-layout: auto;
          border-collapse: collapse;
        }

        .preview-table th,
        .preview-table td {
          padding: 6px 8px;
          font-size: 12px;
          border: 1px solid #e0e6ed;
          text-align: left;
          vertical-align: top;
        }

        .preview-table th {
          background-color: #f4f6f9;
          font-weight: 600;
          color: #34495e;
        }

        .header-text {
          white-space: normal;
          word-wrap: break-word;
          line-height: 1.2;
        }
      `}</style>
    </div>
  );
};

export default InvoiceTablePreview;
