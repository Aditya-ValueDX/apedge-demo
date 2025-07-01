import React, { useEffect, useState } from 'react';
import ViewDocumentModal from '../Upload/ViewDocumentModal.js'; // Added .js extension
import '../styles/ExtractionQueue.css'; // Apply shared queue styles

const CompletedQueue = () => {
  const [invoices, setInvoices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [docUrl, setDocUrl] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/invoices')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const completed = data.filter(inv =>
          ['matched', 'verified', 'Approved'].includes(inv.status)
        );
        setInvoices(completed);
      })
      .catch(error => console.error("Failed to fetch completed invoices:", error)); // Improved error logging
  }, []);

  const openViewer = (url) => {
    if (url) {
      setDocUrl(`http://localhost:5000/${url}`);
      setModalOpen(true);
    } else {
      console.warn("No document available for viewing."); // Replaced alert()
    }
  };

  return (
    <div className="processing-queue">
      <div className="queue-header">Approved Invoices</div>

      {invoices.length === 0 ? (
        <p style={{ marginTop: '20px', fontSize: '15px' }}>No completed invoices found.</p>
      ) : (
        <div className="table-container">
          <table className="queue-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Invoice ID</th>
                <th>Vendor</th>
                {/* <th>Invoice Total</th> */}
                <th>Date</th>
                <th>Status</th>
                <th>Document</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{inv.id}</td>
                  <td>{inv.vendor || '—'}</td>
                  {/* <td>{inv.total ? `₹${inv.total.toLocaleString()}` : '—'}</td> */}
                  <td>{inv.date ? new Date(inv.date).toLocaleDateString() : '—'}</td>
                  <td>
                    <span className={`status-tag ${inv.status}`}>
                      {inv.status === 'Approved' ? 'Verified' : 'Approved'}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn" onClick={() => openViewer(inv.filePath)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ViewDocumentModal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        fileUrl={docUrl}
      />
    </div>
  );
};

export default CompletedQueue;
