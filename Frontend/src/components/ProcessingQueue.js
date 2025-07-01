import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';

const ProcessingQueue = ({ mode = 'processing' }) => {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const endpoint =
      mode === 'ocr'
        ? '/api/invoices/ocr-queue/'
        : '/api/invoices/processing-queue/';

    axios.get(endpoint)
      .then(res => {
        const data = res.data.map(inv => ({
          id: inv.id, // ✅ this line is REQUIRED
          name: inv.invoice_number + '.pdf',
          source: inv.vendor?.name || 'Unknown',
          size: (Math.random() * 3 + 1).toFixed(2) + ' MB',
          progress: mode === 'ocr' ? Math.floor(inv.ocr_confidence) : 100,
          status: mode === 'ocr' ? 'exception' : 'processing',
          result: mode === 'ocr'
            ? `OCR confidence ${inv.ocr_confidence}%`
            : 'Queued for matching...'
        }

        ));

        debugger

        setFiles(data);
        console.log("✅ Loaded files:", data);

      })
      .catch(err => {
        console.error('Queue fetch error:', err.message);
        console.error('Full error:', err.toJSON?.() ?? err);
      });
  }, [mode]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return '#3498db';
      case 'success': return '#27ae60';
      case 'error': return '#e74c3c';
      case 'pending': return '#f39c12';
      case 'exception': return '#e67e22';
      default: return '#95a5a6';
    }
  };

  const shouldShowRetry = (file) =>
    file.status === 'error' || file.result?.toLowerCase().includes('failed');

  const shouldShowView = (file) =>
    file.status === 'success' || file.result?.toLowerCase().includes('successful');

  return (
    <>
      <div className="processing-queue">
        <div className="queue-header">
          <span>{mode === 'ocr' ? '🔍 OCR Queue' : '📋 Processing Queue'} ({files.length} items)</span>
        </div>
        <table className="queue-table">
          <thead>
            <tr>
              <th>Invoice no.</th>
              <th>Vendor</th>
              {/* <th>Size</th> */}
              <th>Progress</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f, i) => (
              <tr key={i}>
                <td>{f.name}</td>
                <td>{f.source}</td>
                {/* <td>{f.size}</td> */}
                <td>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${f.progress}%` }}></div>
                  </div>
                </td>
                <td style={{ color: getStatusColor(f.status) }}>{f.result}</td>
                <td>
                  {f.id && (
                    // <button className="action-btn view" onClick={() => navigate(`/editor/${f.id}`)}>
                    <button className="action-btn view" onClick={() => navigate(`/editor`)}>
                      View
                    </button>
                  )}

                </td>

              </tr>
            ))}
          </tbody>


        </table>
      </div>

      <style>{`
  .processing-queue {
    padding: 50px 70px;
    font-family: 'Segoe UI', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center; /* ✅ centers horizontally */
  }

  .queue-header {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
    align-self: flex-start;
  }

  .queue-table {
    width: 95%;
    max-width: 1100px;
    border-collapse: collapse;
    font-size: 14px;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    border-radius: 6px;
    overflow: hidden;
  }

  .queue-table th,
  .queue-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #e0e0e0;
    vertical-align: middle;
  }

  .queue-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    text-align: center;
  }

  .queue-table td:nth-child(1),
  .queue-table td:nth-child(2) {
    text-align: left;
  }

  .queue-table td:nth-child(3),
  .queue-table td:nth-child(4),
  .queue-table td:nth-child(5),
  .queue-table td:nth-child(6) {
    text-align: center;
  }

  .bar-bg {
    width: 120px;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin: 0 auto;
  }

  .bar-fill {
    height: 8px;
    background: #3498db;
    transition: width 0.3s ease;
  }

  .action-btn {
    padding: 6px 12px;
    margin-right: 6px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    font-weight: 500;
  }

  .action-btn.view {
    background: #27ae60;
    color: white;
  }

  .action-btn.retry {
    background: #e74c3c;
    color: white;
  }
`}</style>


    </>
  );
};

export default ProcessingQueue;
