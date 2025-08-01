import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Upload, CheckCircle, XCircle, Clock, Eye, Hash, Calendar, DollarSign, User, ListFilter } from 'lucide-react';
import { USER_ROLES, REIMBURSEMENT_STATUSES, API_BASE_URL } from '../utils/config';
import TableComponent from '../components/TableComponent';
import ViewDocumentModal from '../components/ViewDocumentModal';
import { useSelector } from 'react-redux'; // Import useSelector from react-redux

const RequesterDashboard = ({ navigateTo }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const userRole = user?.role;
  const userId = user?.id;

  // Initialize summaryData and recentActivity as state variables
  const [summaryData, setSummaryData] = useState({
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileForModal, setSelectedFileForModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStatusClass = (status) => {
    switch (status) {
      case REIMBURSEMENT_STATUSES.WAITING_APPROVAL: return 'status-badge yellow';
      case REIMBURSEMENT_STATUSES.STAGE_1_APPROVED:
      case REIMBURSEMENT_STATUSES.STAGE_2_APPROVED:
      case REIMBURSEMENT_STATUSES.PROCESSED: return 'status-badge green';
      case REIMBURSEMENT_STATUSES.STAGE_1_REJECTED:
      case REIMBURSEMENT_STATUSES.STAGE_2_REJECTED:
      case REIMBURSEMENT_STATUSES.ERROR: return 'status-badge red';
      case 'Draft': return 'status-badge gray'; // Assuming 'Draft' is a status
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

  const openDocumentViewModal = (file) => {
    setSelectedFileForModal(file);
    setIsModalOpen(true);
  };

  const closeDocumentViewModal = () => {
    setIsModalOpen(false);
    setSelectedFileForModal(null);
  };

  // Function to fetch dashboard data from the backend
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || !userId || !userRole) {
      setSummaryData({ pendingApproval: 0, approved: 0, rejected: 0, draft: 0 });
      setRecentActivity([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch Summary Data
      const summaryResponse = await fetch(`${API_BASE_URL}/api/reimbursements/summary/requester`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-role': userRole,
        },
      });

      if (!summaryResponse.ok) {
        throw new Error(`Failed to fetch summary data: ${summaryResponse.statusText}`);
      }
      const summaryData = await summaryResponse.json();
      setSummaryData(summaryData);

      // Fetch Recent Activity
      const activityResponse = await fetch(`${API_BASE_URL}/api/reimbursements/recent-activity/requester`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-role': userRole,
        },
      });

      if (!activityResponse.ok) {
        throw new Error(`Failed to fetch recent activity: ${activityResponse.statusText}`);
      }
      const activityData = await activityResponse.json();
      // Ensure file paths are absolute for display if they are relative from backend
      const updatedActivityData = activityData.map(item => ({
        ...item,
        filePath: item.filePath.startsWith('http') ? item.filePath : `${API_BASE_URL}${item.filePath}`,
      }));
      setRecentActivity(updatedActivityData);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userId, userRole]); // Dependencies for useCallback

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Trigger fetch when component mounts or dependencies change

  // Columns for the TableComponent
  const columns = useMemo(() => [
    { key: 'id', header: <><Hash className="icon-in-label" /> Request ID</>, sortable: true, filterable: false, filterType: 'text', width: '120px' },
    { key: 'date', header: <><Calendar className="icon-in-label" /> Date</>, sortable: true, filterable: false, filterType: 'date', width: '150px' },
    {
      key: 'amount',
      header: <><DollarSign className="icon-in-label" /> Amount</>,
      sortable: true,
      filterable: false,
      filterType: 'number',
      render: (item) => `₹${parseFloat(item.amount || 0).toFixed(2)}`, // Safely parse to float and then toFixed
      width: '120px'
    },
    {
      key: 'status',
      header: <><ListFilter className="icon-in-label" /> Status</>,
      sortable: true,
      filterable: false,
      filterType: 'select',
      filterOptions: () => [...new Set(recentActivity.map(req => req.status))],
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
            onClick={(e) => { e.stopPropagation(); openDocumentViewModal({ url: item.filePath, name: item.fileName, mimeType: item.mimeType }); }}
            className="icon-button text-blue"
            title="View Bill"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ], [recentActivity, getStatusClass, capitalize, openDocumentViewModal]); // Added dependencies to useMemo

  // State for TableComponent's internal sorting and filtering
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});

  // Conditional rendering for access control
  if (!isAuthenticated) {
    return (
      <div className="text-center py-10 text-red-600 font-bold text-xl">
        Please log in to view this page.
      </div>
    );
  }

  if (userRole !== USER_ROLES.REQUESTER && userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.APPROVER) {
    return (
      <div className="text-center py-10 text-red-600 font-bold text-xl">
        Access Denied: You do not have permission to view this page.
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-10 text-blue-600">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600 font-bold text-xl">{error}</div>;
  }

  return (
    <div className="card-container">
      <h2 className="section-title">Your Dashboard</h2>
      <div className="section-separator"></div>

      {/* Summary Cards */}
      <div className="dashboard-summary-grid">
        <div className="summary-card blue">
          <div>
            <div className="summary-card-value">{summaryData.pendingApproval}</div>
            <div className="summary-card-label">Pending Approval</div>
          </div>
          <Clock className="summary-card-icon" />
        </div>
        <div className="summary-card green">
          <div>
            <div className="summary-card-value">{summaryData.approved}</div>
            <div className="summary-card-label">Approved Claims</div>
          </div>
          <CheckCircle className="summary-card-icon" />
        </div>
        <div className="summary-card red">
          <div>
            <div className="summary-card-value">{summaryData.rejected}</div>
            <div className="summary-card-label">Rejected Claims</div>
          </div>
          <XCircle className="summary-card-icon" />
        </div>
        <div className="summary-card purple">
          <div>
            <div className="summary-card-value">{summaryData.draft}</div>
            <div className="summary-card-label">Draft Claims</div>
          </div>
          <Upload className="summary-card-icon" />
        </div>
      </div>

      {/* Action Button - Only visible for requesters */}
      {userRole === USER_ROLES.REQUESTER && (
        <div className="action-button-center">
          <button
            onClick={() => navigateTo('reimbursement_form')}
            className="btn-primary"
          >
            <Upload className="nav-icon" /> New Reimbursement Request
          </button>
        </div>
      )}

      {/* Recent Activity Feed */}
      <h3 className="section-title">Recent Activity</h3>
      <div className="overflow-x-auto">
        <TableComponent
          data={recentActivity}
          columns={columns}
          sortField={sortField}
          setSortField={setSortField}
          sortAsc={sortAsc}
          setSortAsc={setSortAsc}
          page={page}
          setPage={setPage}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          onRowClick={(item) => navigateTo('reimbursement_form', { requestId: item.id, readOnly: true })}
          emptyMessage="No recent activity found."
          pageSize={5}
        />
      </div>

      {/* View Document Modal */}
      <ViewDocumentModal
        isOpen={isModalOpen}
        onRequestClose={closeDocumentViewModal}
        fileUrl={selectedFileForModal?.url}
        fileName={selectedFileForModal?.name}
        mimeType={selectedFileForModal?.mimeType}
      />
    </div>
  );
};

export default RequesterDashboard;
