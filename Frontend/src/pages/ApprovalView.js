// src/pages/ApprovalView.js
import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, Paperclip } from 'lucide-react';
import { REIMBURSEMENT_STAGES, REIMBURSEMENT_STATUSES, USER_ROLES, API_BASE_URL } from '../utils/config';
import TableComponent from '../components/TableComponent'; // Import the TableComponent

const ApprovalView = ({ navigateTo, requestId, userRole }) => {
  // All Hooks must be called unconditionally at the top level
  const [request, setRequest] = useState(null);
  const [overallApproverComments, setOverallApproverComments] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [approvedAmounts, setApprovedAmounts] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // State for TableComponent's sorting, pagination, and filters
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});

  // Dummy data for all requests (simulating a fetch)
  const allDummyRequests = useMemo(() => [
    {
      id: 'REQ001',
      requestDate: '2024-07-01',
      requesterName: 'John Doe',
      overallRequesterComments: 'Software licenses for Q3.',
      approverComments: '',
      botRemarks: 'All items eligible as per policy.',
      status: REIMBURSEMENT_STATUSES.WAITING_APPROVAL,
      stage: REIMBURSEMENT_STAGES.REVIEW,
      lineItems: [
        { id: 101, billNo: 'LIC001', billType: 'Software', vendor: 'Microsoft', date: '2024-06-28', amount: 5000.00, requesterComments: 'Annual subscription', approverComments: '', botRemarks: 'Eligible', approved: null },
        { id: 102, billNo: 'LIC002', billType: 'Software', vendor: 'Adobe', date: '2024-06-29', amount: 2000.00, requesterComments: 'Creative Cloud licenses', approverComments: '', botRemarks: 'Eligible', approved: null },
      ],
      attachedBills: []
    },
    {
      id: 'REQ002',
      requestDate: '2024-07-02',
      requesterName: 'Jane Smith',
      overallRequesterComments: 'Office furniture purchase.',
      approverComments: '',
      botRemarks: 'Office chair eligible, desk exceeds limit.',
      status: REIMBURSEMENT_STATUSES.WAITING_APPROVAL,
      stage: REIMBURSEMENT_STAGES.REVIEW,
      lineItems: [
        { id: 201, billNo: 'FURN001', billType: 'Furniture', vendor: 'Office Depot', date: '2024-07-01', amount: 1200.00, requesterComments: 'Ergonomic chair', approverComments: '', botRemarks: 'Eligible', approved: null },
        { id: 202, billNo: 'FURN002', billType: 'Furniture', vendor: 'IKEA', date: '2024-07-01', amount: 2500.00, requesterComments: 'Standing desk', approverComments: '', botRemarks: 'Not Eligible: Exceeds furniture limit.', approved: null },
      ],
      attachedBills: []
    },
    {
      id: 'REQ003',
      requestDate: '2024-07-03',
      requesterName: 'Alice Johnson',
      overallRequesterComments: 'Subscription for project management tool.',
      approverComments: '',
      botRemarks: 'Eligible as per policy.',
      status: REIMBURSEMENT_STATUSES.WAITING_APPROVAL,
      stage: REIMBURSEMENT_STAGES.REVIEW,
      lineItems: [
        { id: 301, billNo: 'SUB001', billType: 'Subscription', vendor: 'Asana', date: '2024-07-03', amount: 500.00, requesterComments: 'Monthly Asana subscription', approverComments: '', botRemarks: 'Eligible', approved: null },
      ],
      attachedBills: []
    },
    {
      id: 'REQ004',
      requestDate: '2024-07-04',
      requesterName: 'Bob Williams',
      overallRequesterComments: 'Team dinner.',
      approverComments: '',
      botRemarks: 'Meal expense eligible.',
      status: REIMBURSEMENT_STATUSES.WAITING_APPROVAL,
      stage: REIMBURSEMENT_STAGES.REVIEW,
      lineItems: [
        { id: 401, billNo: 'DINNER01', billType: 'Food', vendor: 'The Diner', date: '2024-07-03', amount: 1500.00, requesterComments: 'Team appreciation dinner', approverComments: '', botRemarks: 'Eligible', approved: null },
      ],
      attachedBills: []
    },
    {
      id: 'REQ005', // This is here for consistency, but won't be default viewed anymore
      requestDate: '2024-07-05',
      requesterName: 'Another Requester',
      overallRequesterComments: 'Travel expenses for client meeting in Mumbai.',
      approverComments: '',
      botRemarks: 'All items eligible as per policy. Travel distance within limit.',
      status: REIMBURSEMENT_STATUSES.WAITING_APPROVAL,
      stage: REIMBURSEMENT_STAGES.REVIEW,
      lineItems: [
        { id: 1, billNo: 'INV001', billType: 'Travel', vendor: 'Uber', date: '2024-07-04', amount: 1500.00, requesterComments: 'To airport', approverComments: '', botRemarks: 'Eligible', approved: null },
        { id: 2, billNo: 'INV002', billType: 'Food', vendor: 'Cafe Delight', date: '2024-07-04', amount: 850.00, requesterComments: 'Client lunch', approverComments: '', botRemarks: 'Eligible', approved: null },
        { id: 3, billNo: 'INV003', billType: 'Office Supplies', vendor: 'Stationery Mart', date: '2024-07-03', amount: 300.00, requesterComments: 'Not Eligible: Exceeds monthly limit for supplies.', botRemarks: 'Not Eligible: Exceeds monthly limit for supplies.', approved: null },
      ],
      attachedBills: [
        { name: 'Uber_Receipt_0704.pdf', url: 'https://placehold.co/400x300/e0e0e0/555555?text=Uber+Bill', type: 'application/pdf' },
        { name: 'Cafe_Delight.jpg', url: 'https://placehold.co/400x300/e0e0e0/555555?text=Cafe+Bill', type: 'image/jpeg' },
      ]
    }
  ], []); // Memoize dummy data to prevent unnecessary re-creation

  useEffect(() => {
    // Filter pending requests for the list based on user role
    const filteredForList = allDummyRequests.filter(req =>
      (userRole === USER_ROLES.APPROVER && req.status === REIMBURSEMENT_STATUSES.WAITING_APPROVAL) ||
      (userRole === USER_ROLES.ADMIN && (req.status === REIMBURSEMENT_STATUSES.WAITING_APPROVAL || req.status === REIMBURSEMENT_STATUSES.STAGE_1_APPROVED))
    );
    setPendingRequests(filteredForList);

    // If a requestId is provided via props (e.g., from Dashboard),
    // set it as the initially selected request to show details.
    // Otherwise, selectedRequestId remains null, showing only the list.
    if (requestId) {
      setSelectedRequestId(requestId);
    } else {
      setSelectedRequestId(null);
    }

  }, [requestId, userRole, allDummyRequests]); // Add allDummyRequests to dependencies

  // This effect runs when selectedRequestId changes to load the specific request details
  useEffect(() => {
    if (selectedRequestId) {
      const currentRequestToDisplay = allDummyRequests.find(req => req.id === selectedRequestId);
      setRequest(currentRequestToDisplay);

      // Initialize approvedAmounts for the newly displayed request
      const initialApprovedAmounts = {};
      if (currentRequestToDisplay && currentRequestToDisplay.lineItems) {
        currentRequestToDisplay.lineItems.forEach(item => {
          initialApprovedAmounts[item.id] = parseFloat(item.amount).toFixed(2);
        });
      }
      setApprovedAmounts(initialApprovedAmounts);
      setOverallApproverComments(''); // Clear overall comments when switching requests
      setActiveTab('details'); // Reset tab to details when a new request is selected
    } else {
      setRequest(null); // Clear request details if no request is selected
      setApprovedAmounts({});
      setOverallApproverComments('');
    }
  }, [selectedRequestId, allDummyRequests]); // Add allDummyRequests to dependencies

  // Define columns for the TableComponent for pending requests
  const pendingRequestsTableColumns = useMemo(() => [
    { key: 'id', header: 'Request ID', sortable: true, filterable: true, filterType: 'text', width: '120px' },
    { key: 'requestDate', header: 'Date', sortable: true, filterable: true, filterType: 'date', width: '150px' },
    { key: 'requesterName', header: 'Requester', sortable: true, filterable: true, filterType: 'text', width: '180px' },
    { 
      key: 'totalAmount', 
      header: 'Total Amount', 
      sortable: true, 
      filterable: false, // Can be filterable by number if needed
      render: (item) => `₹${item.lineItems.reduce((sum, li) => sum + parseFloat(li.amount || 0), 0).toFixed(2)}`,
      width: '120px'
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: () => {
        const statuses = new Set();
        allDummyRequests.forEach(req => {
          if ((userRole === USER_ROLES.APPROVER && req.status === REIMBURSEMENT_STATUSES.WAITING_APPROVAL) ||
              (userRole === USER_ROLES.ADMIN && (req.status === REIMBURSEMENT_STATUSES.WAITING_APPROVAL || req.status === REIMBURSEMENT_STATUSES.STAGE_1_APPROVED))) {
            statuses.add(req.status);
          }
        });
        return Array.from(statuses);
      },
      render: (item) => (
        <span className={getStatusClass(item.status)}>
          {item.status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </span>
      ),
      width: '180px'
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (item) => (
        <div className="table-actions">
          <button
            onClick={(e) => { e.stopPropagation(); handleViewRequest(item); }} // Stop propagation to prevent row click
            className="btn-primary-small"
          >
            View
          </button>
        </div>
      ),
    },
  ], [allDummyRequests, userRole]); // Re-memoize if dummy data or userRole changes


  // Handler to view a specific request from the list
  const handleViewRequest = (item) => {
    setSelectedRequestId(item.id);
  };

  // Handle change for editable approved amount
  const handleApprovedAmountChange = (id, value) => {
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setApprovedAmounts(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleLineItemApproval = (id, approvedStatus) => {
    setRequest(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item =>
        item.id === id ? { ...item, approved: approvedStatus } : item
      )
    }));
  };

  const handleLineItemCommentsChange = (id, comments) => {
    setRequest(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item =>
        item.id === id ? { ...item, approverComments: comments } : item
      )
    }));
  };

  const handleOverallApproval = (approvedStatus) => {
    if (!request) {
        console.error("Attempted overall approval on a null request.");
        return;
    }

    const updatedLineItems = request.lineItems.map(item => ({
      ...item,
      approved: approvedStatus,
      approverComments: overallApproverComments || item.approverComments,
      amount: parseFloat(approvedAmounts[item.id] || 0)
    }));

    let newStatus;
    if (request.status === REIMBURSEMENT_STATUSES.WAITING_APPROVAL) {
      newStatus = approvedStatus ? REIMBURSEMENT_STATUSES.STAGE_1_APPROVED : REIMBURSEMENT_STATUSES.STAGE_1_REJECTED;
    } else if (request.status === REIMBURSEMENT_STATUSES.STAGE_1_APPROVED) {
      newStatus = approvedStatus ? REIMBURSEMENT_STATUSES.STAGE_2_APPROVED : REIMBURSEMENT_STATUSES.STAGE_2_REJECTED;
    } else {
      newStatus = request.status;
    }

    console.log(`Submitting Request ${request.id} with status ${newStatus} and updated line items:`, updatedLineItems);

    alert(`Request ${request.id} has been ${approvedStatus ? 'approved' : 'rejected'}! New status: ${newStatus}`);
    
    // After approving/rejecting, clear the selected request to go back to the list view
    setSelectedRequestId(null);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case REIMBURSEMENT_STATUSES.WAITING_APPROVAL: return 'status-badge yellow';
      case REIMBURSEMENT_STATUSES.STAGE_1_APPROVED:
      case REIMBURSEMENT_STATUSES.STAGE_2_APPROVED:
      case REIMBURSEMENT_STATUSES.PROCESSED: return 'status-badge green';
      case REIMBURSEMENT_STATUSES.STAGE_1_REJECTED:
      case REIMBURSEMENT_STATUSES.STAGE_2_REJECTED:
      case REIMBURSEMENT_STATUSES.ERROR: return 'status-badge red';
      default: return 'status-badge gray';
    }
  };

  // --- Start of conditional rendering for user role ---
  if (userRole !== USER_ROLES.APPROVER && userRole !== USER_ROLES.ADMIN) {
    return (
      <div className="text-center py-10 text-red-600 font-bold text-xl">
        Access Denied: You do not have permission to view this page.
      </div>
    );
  }
  // --- End of conditional rendering for user role ---


  // Main render logic: show list if no request selected, else show detailed view
  return (
    <div className="card-container">
      {!selectedRequestId ? (
        // Display only the list of pending requests using TableComponent
        <>
          <h2 className="section-title">Pending Reimbursement Requests</h2>
          <div className="section-separator"></div>
          <TableComponent
            data={pendingRequests}
            columns={pendingRequestsTableColumns}
            sortField={sortField}
            setSortField={setSortField}
            sortAsc={sortAsc}
            setSortAsc={setSortAsc}
            page={page}
            setPage={setPage}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            onRowClick={handleViewRequest} // Row click also triggers view
            emptyMessage="No pending requests to display."
            pageSize={5} // Display 5 items per page
          />
        </>
      ) : (
        // Display the detailed view of the selected request
        request ? (
          <>
            <h2 className="section-title">Approve Reimbursement Request: {request.id}</h2>

            {/* Back to list button */}
            <button onClick={() => setSelectedRequestId(null)} className="btn-secondary mb-4">
              ← Back to Pending List
            </button>

            {/* Request Summary */}
            <div className="request-summary-box">
              <div className="request-summary-grid">
                <div><span className="summary-label">Requester:</span> {request.requesterName}</div>
                <div><span className="summary-label">Request Date:</span> {request.requestDate}</div>
                <div className="full-span">
                  <span className="summary-label">Requester Comments:</span> {request.overallRequesterComments || 'N/A'}
                </div>
                <div className="full-span">
                  <span className="summary-label">Current Status:</span>
                  <span className={`ml-2 ${getStatusClass(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                <div className="full-span">
                  <span className="summary-label">Overall BOT Remarks:</span>
                  <span className="text-green-700 ml-2">{request.botRemarks}</span>
                </div>
              </div>
            </div>

            {/* Tabs for Details and Attached Bills */}
            <div className="tab-nav">
              <button
                onClick={() => setActiveTab('details')}
                className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
              >
                Line Items for Approval
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
              >
                Attached Bills ({request.attachedBills.length})
              </button>
            </div>

            {activeTab === 'details' && (
              <>
                {/* Line Item Table for Approval */}
                <div className="overflow-x-auto mb-8">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bill No</th>
                        <th>Type</th>
                        <th>Vendor</th>
                        <th>Date</th>
                        <th>Requested Amount</th>
                        <th>Approved Amount</th>
                        <th>Requester Comments</th>
                        <th>BOT Remarks</th>
                        <th>Approver Comments</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.billNo}</td>
                          <td>{item.billType}</td>
                          <td>{item.vendor}</td>
                          <td>{item.date}</td>
                          <td>₹{parseFloat(item.amount).toFixed(2)}</td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className="form-input p-2 w-28"
                              value={approvedAmounts[item.id]}
                              onChange={(e) => handleApprovedAmountChange(item.id, e.target.value)}
                              disabled={item.approved !== null}
                            />
                          </td>
                          <td>{item.requesterComments || 'N/A'}</td>
                          <td>
                            <span className={`font-medium ${item.botRemarks.includes('Eligible') ? 'text-green-700' : 'text-red-600'}`}>
                              {item.botRemarks}
                            </span>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input p-2"
                              value={item.approverComments}
                              onChange={(e) => handleLineItemCommentsChange(item.id, e.target.value)}
                              placeholder="Add comments"
                              disabled={item.approved !== null}
                            />
                          </td>
                          <td className="text-center">
                            <div className="table-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleLineItemApproval(item.id, true)}
                                className={`icon-button ${item.approved === true ? 'bg-green-500 text-white' : 'text-green-500 hover:bg-green-100'} ${item.approved !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Approve Line Item"
                                disabled={item.approved !== null}
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleLineItemApproval(item.id, false)}
                                className={`icon-button ${item.approved === false ? 'bg-red-500 text-white' : 'text-red-500 hover:bg-red-100'} ${item.approved !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Reject Line Item"
                                disabled={item.approved !== null}
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Overall Approval Actions */}
                <div className="overall-approval-section">
                  <h3 className="section-title" style={{ marginBottom: '16px' }}>Overall Approval</h3>
                  <div className="form-group mb-4">
                    <label htmlFor="overallApproverComments" className="form-label">Overall Approver Remarks</label>
                    <textarea
                      id="overallApproverComments"
                      className="form-textarea"
                      rows="3"
                      value={overallApproverComments}
                      onChange={(e) => setOverallApproverComments(e.target.value)}
                      placeholder="Add overall comments for the request..."
                    ></textarea>
                  </div>
                  <div className="overall-actions">
                    <div className="total-amount-display">
                      Requested Amount: <span className="amount-value">₹{request.lineItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toFixed(2)}</span>
                      <span className="approved-amount-value ml-4">Approved Amount: ₹{request.lineItems.reduce((sum, item) => sum + (item.approved ? parseFloat(approvedAmounts[item.id] || 0) : 0), 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <button
                        onClick={() => handleOverallApproval(true)}
                        className="btn-success mr-4"
                      >
                        Approve All
                      </button>
                      <button
                        onClick={() => handleOverallApproval(false)}
                        className="btn-danger"
                      >
                        Reject All
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'attachments' && (
              <div className="attachments-grid">
                {request.attachedBills.length === 0 ? (
                  <p className="text-gray-600 text-center col-span-full py-10">No bills attached to this request.</p>
                ) : (
                  request.attachedBills.map((bill, index) => (
                    <div key={index} className="bill-card">
                      <img
                        src={bill.url}
                        alt={bill.name}
                        className="bill-preview-img"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x300/e0e0e0/555555?text=Preview+Not+Available`; }}
                      />
                      <div className="bill-info">
                        <p className="bill-name">{bill.name}</p>
                        <p className="bill-type">{bill.type}</p>
                      </div>
                      <div className="bill-overlay">
                        <button
                          onClick={() => window.open(bill.url, '_blank')}
                          className="bill-view-button"
                          title="View Bill"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
            <div className="text-center py-10 text-gray-600">Loading request details or request not found...</div>
        )
      )}
    </div>
  );
};

export default ApprovalView;