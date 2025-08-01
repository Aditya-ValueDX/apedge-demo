// src/pages/ERPIntegration.js
import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, RefreshCcw } from 'lucide-react';
import { USER_ROLES, REIMBURSEMENT_STATUSES, REIMBURSEMENT_STAGES, API_BASE_URL } from '../utils/config';

const ERPIntegration = ({ navigateTo, userRole }) => {
  const [requestsToProcess, setRequestsToProcess] = useState([
    { id: 'REQ006', date: '2024-07-01', requester: 'Bob White', approvedAmount: 300.00, status: REIMBURSEMENT_STATUSES.STAGE_2_APPROVED, erpStatus: 'Pending' },
    { id: 'REQ007', date: '2024-06-28', requester: 'Charlie Green', approvedAmount: 180.50, status: REIMBURSEMENT_STATUSES.STAGE_2_APPROVED, erpStatus: 'Pending' },
    { id: 'REQ008', date: '2024-06-25', requester: 'Diana Prince', approvedAmount: 95.00, status: REIMBURSEMENT_STATUSES.STAGE_2_APPROVED, erpStatus: 'Error', erpError: 'Invalid GL Code' },
    { id: 'REQ009', date: '2024-06-20', requester: 'Eve Black', approvedAmount: 250.00, status: REIMBURSEMENT_STATUSES.STAGE_1_APPROVED, erpStatus: 'Pending' },
  ]);

  const [selectedRequests, setSelectedRequests] = useState([]);
  const [processing, setProcessing] = useState(false);

  if (userRole !== USER_ROLES.ADMIN) {
    return (
      <div className="text-center py-10 text-red-600 font-bold text-xl">
        Access Denied: You do not have permission to view this page.
      </div>
    );
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRequests(requestsToProcess.filter(req => req.erpStatus === 'Pending').map(req => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (id) => {
    setSelectedRequests(prev =>
      prev.includes(id) ? prev.filter(reqId => reqId !== id) : [...prev, id]
    );
  };

  const handleUploadToERP = async () => {
    if (selectedRequests.length === 0) {
      alert('Please select at least one request to upload.');
      return;
    }

    setProcessing(true);
    console.log('Uploading selected requests to ERP:', selectedRequests);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const updatedRequests = requestsToProcess.map(req => {
      if (selectedRequests.includes(req.id)) {
        if (req.id === 'REQ008') {
          return { ...req, erpStatus: 'Error', erpError: 'Re-attempt failed: Still invalid GL Code' };
        }
        return { ...req, erpStatus: REIMBURSEMENT_STATUSES.PROCESSED, status: REIMBURSEMENT_STATUSES.PROCESSED, stage: REIMBURSEMENT_STAGES.ACCOUNT };
      }
      return req;
    });

    setRequestsToProcess(updatedRequests);
    setSelectedRequests([]);
    setProcessing(false);
    alert('ERP upload simulation complete. Check ERP Status column.');
  };

  const getERPStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-badge yellow';
      case REIMBURSEMENT_STATUSES.PROCESSED: return 'status-badge green';
      case REIMBURSEMENT_STATUSES.ERROR: return 'status-badge red';
      default: return 'status-badge gray';
    }
  };

  return (
    <div className="card-container">
      <h2 className="section-title">ERP Integration Dashboard</h2>

      <div className="erp-header-controls">
        <p className="erp-status-text">
          Requests ready for ERP upload: <span className="count">{requestsToProcess.filter(r => r.erpStatus === 'Pending').length}</span>
        </p>
        <button
          onClick={handleUploadToERP}
          className="btn-primary"
          disabled={processing || selectedRequests.length === 0}
        >
          {processing ? (
            <>
              <RefreshCcw className="nav-icon mr-2 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Upload className="nav-icon mr-2" /> Upload Selected to ERP
            </>
          )}
        </button>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  onChange={handleSelectAll}
                  checked={selectedRequests.length > 0 && selectedRequests.length === requestsToProcess.filter(req => req.erpStatus === 'Pending').length}
                />
              </th>
              <th>Request ID</th>
              <th>Date</th>
              <th>Requester</th>
              <th>Approved Amount</th>
              <th>Current Status</th>
              <th>ERP Status</th>
            </tr>
          </thead>
          <tbody>
            {requestsToProcess.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">No requests available for ERP processing.</td>
              </tr>
            ) : (
              requestsToProcess.map((request) => (
                <tr key={request.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectedRequests.includes(request.id)}
                      onChange={() => handleSelectRequest(request.id)}
                      disabled={request.erpStatus === REIMBURSEMENT_STATUSES.PROCESSED || processing}
                    />
                  </td>
                  <td>{request.id}</td>
                  <td>{request.date}</td>
                  <td>{request.requester}</td>
                  <td>₹{request.approvedAmount.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${
                      request.status.includes('Approved') || request.status === REIMBURSEMENT_STATUSES.PROCESSED ? 'green' : 'gray'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td>
                    <span className={getERPStatusClass(request.erpStatus)}>
                      {request.erpStatus}
                    </span>
                    {request.erpStatus === REIMBURSEMENT_STATUSES.ERROR && (
                      <p className="text-red-600 text-xs mt-1">{request.erpError}</p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ERPIntegration;
