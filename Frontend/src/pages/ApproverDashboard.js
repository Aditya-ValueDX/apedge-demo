// src/pages/ApproverDashboard.js
import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, List, DollarSign, User, FileText, BarChart2 } from 'lucide-react';
import { USER_ROLES, REIMBURSEMENT_STATUSES, API_BASE_URL } from '../utils/config';
import TableComponent from '../components/TableComponent'; // Corrected import path

const ApproverDashboard = ({ navigateTo, userRole }) => {
  // Dummy summary data
  const summaryData = {
    pendingMyApproval: 7,
    approvedByMe: 25,
    rejectedByMe: 3,
    totalRequestsReviewed: 35,
    totalAmountToApprove: 15200.50,
  };

  // Dummy pending requests data - aligned keys with ApprovalView
  const [pendingRequests] = useState([
    { id: 'REQ005', requestDate: '2024-07-05', requesterName: 'Another Requester', approver: 'Approver', status: REIMBURSEMENT_STATUSES.WAITING_APPROVAL, totalAmount: 120.00 },
    { id: 'REQ008', requestDate: '2024-07-03', requesterName: 'Charlie Delta', approver: 'Approver', status: REIMBURSEMENT_STATUSES.WAITING_APPROVAL, totalAmount: 850.75 },
    { id: 'REQ009', requestDate: '2024-07-02', requesterName: 'Eve Green', approver: 'Approver', status: REIMBURSEMENT_STATUSES.WAITING_APPROVAL, totalAmount: 300.00 },
    { id: 'REQ010', requestDate: '2024-07-01', requesterName: 'Frank White', approver: 'Approver', status: REIMBURSEMENT_STATUSES.WAITING_APPROVAL, totalAmount: 550.00 },
    { id: 'REQ011', requestDate: '2024-06-30', requesterName: 'Grace Black', approver: 'Approver', status: REIMBURSEMENT_STATUSES.WAITING_APPROVAL, totalAmount: 210.50 },
  ]);

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

  const capitalize = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pendingRequestsColumns = useMemo(() => [
    { key: 'id', header: 'Request ID', sortable: true, filterable: true, filterType: 'text', width: '100px' },
    { key: 'requestDate', header: 'Date', sortable: true, filterable: true, filterType: 'date', width: '120px' }, // Changed key to requestDate
    { key: 'requesterName', header: 'Requester', sortable: true, filterable: true, filterType: 'text', width: '150px' }, // Changed key to requesterName
    { key: 'totalAmount', header: 'Amount', sortable: true, filterable: false, render: (item) => `₹${item.totalAmount.toFixed(2)}`, width: '100px' },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true, // Enabled filtering for status
      filterType: 'select',
      filterOptions: () => Object.values(REIMBURSEMENT_STATUSES), // Dynamic options from constants
      render: (item) => (
        <span className={getStatusClass(item.status)}>
          {capitalize(item.status)}
        </span>
      ),
      width: '150px'
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '80px',
      render: (item) => (
        <div className="table-actions">
          <button
            // CORRECTED: Pass item.id directly as the second argument
            onClick={(e) => { e.stopPropagation(); navigateTo('approval_view', item.id); }}
            className="btn-primary-small" // Using the refined small primary button
            title="Review Request"
          >
            <CheckCircle className="w-4 h-4" /> {/* Smaller icon for small button */}
          </button>
        </div>
      ),
    },
  ], [navigateTo]); // Added navigateTo to dependencies

  // TableComponent state management
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});

  // Access control check (assuming userRole is passed as a prop)
  if (userRole !== USER_ROLES.APPROVER && userRole !== USER_ROLES.ADMIN) {
    return (
      <div className="text-center py-10 text-red-600 font-bold text-xl">
        Access Denied: You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="card-container">
      <h2 className="section-title">Approver Dashboard</h2>
      <div className="section-separator"></div>

      {/* Summary Cards for Approver */}
      <div className="dashboard-summary-grid">
        <div className="summary-card blue">
          <div>
            <div className="summary-card-value">{summaryData.pendingMyApproval}</div>
            <div className="summary-card-label">Pending My Approval</div>
          </div>
          <Clock className="summary-card-icon" />
        </div>
        <div className="summary-card green">
          <div>
            <div className="summary-card-value">{summaryData.approvedByMe}</div>
            <div className="summary-card-label">Approved by Me</div>
          </div>
          <CheckCircle className="summary-card-icon" />
        </div>
        <div className="summary-card red">
          <div>
            <div className="summary-card-value">{summaryData.rejectedByMe}</div>
            <div className="summary-card-label">Rejected by Me</div>
          </div>
          <XCircle className="summary-card-icon" />
        </div>
        <div className="summary-card purple">
          <div>
            <div className="summary-card-value">₹{summaryData.totalAmountToApprove.toFixed(2)}</div>
            <div className="summary-card-label">Total Amount to Approve</div>
          </div>
          <DollarSign className="summary-card-icon" />
        </div>
      </div>

      {/* Quick Actions / Links */}
      {/* <div className="action-button-center" style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigateTo('request_list')}
          className="btn-primary"
        >
          <List className="nav-icon" /> View All Requests
        </button>
        <button
          // This button navigates to ApprovalView without a specific ID,
          // so it will show the list of pending requests first.
          onClick={() => navigateTo('approval_view')}
          className="btn-secondary"
          style={{ marginLeft: '16px' }}
        >
          <CheckCircle className="nav-icon" /> Start Approving
        </button>
      </div> */}

      {/* Recent Pending Requests Table */}
      <h3 className="section-title">Recent Pending Requests</h3>
      <div className="overflow-x-auto">
        <TableComponent
          data={pendingRequests}
          columns={pendingRequestsColumns}
          sortField={sortField}
          setSortField={setSortField}
          sortAsc={sortAsc}
          setSortAsc={setSortAsc}
          page={page}
          setPage={setPage}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          // CORRECTED: Pass item.id directly as the second argument for row click
          onRowClick={(item) => navigateTo('approval_view', item.id)}
          emptyMessage="No pending requests found."
          pageSize={5}
        />
      </div>
    </div>
  );
};

export default ApproverDashboard;