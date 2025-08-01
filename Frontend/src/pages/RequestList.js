// src/pages/RequestList.js
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Filter, Search, Download, Edit, Trash2, Eye, X, ChevronDown, Calendar, FileText, User, Hash, Clock, ListFilter, DollarSign } from 'lucide-react';
import { USER_ROLES, REIMBURSEMENT_STATUSES, API_BASE_URL } from '../utils/config';
import TableComponent from '../components/TableComponent';
import ViewDocumentModal from '../components/ViewDocumentModal';
import { toast, ToastContainer } from 'react-toastify'; // Import toast and ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS

const RequestList = ({ navigateTo, userRole, userId }) => { // Accept userId prop

  const [requests, setRequests] = useState([]); // Initialize as empty, fetch from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Keep error state for conditional rendering

  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'All',
    requester: '',
    approver: '',
    fromDate: '',
    toDate: '',
    globalSearch: '',
  });

  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileForModal, setSelectedFileForModal] = useState(null);

  // Fetch requests from the backend
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        const response = await fetch(`${API_BASE_URL}/api/reimbursements`);
        if (response.ok) {
          const data = await response.json();
          // Process data to include totalAmount, requester, and ensure absolute URLs
          const processedData = data.map(req => {
            // Calculate total amount from line items
            const totalAmount = req.lineItems ? req.lineItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) : 0;

            // Determine requester name (using a placeholder or ID if name not available)
            // In a real app, you'd likely fetch user names based on requesterId
            const requesterName = req.requesterName || `User ${req.requesterId}`; // Fallback

            return {
              ...req,
              date: req.requestDate, // Ensure 'date' field is populated from 'requestDate'
              totalAmount: totalAmount,
              requester: requesterName,
              attachedBills: req.attachedBills ? req.attachedBills.map(bill => ({
                ...bill,
                url: bill.url.startsWith('http') ? bill.url : `${API_BASE_URL}${bill.url}`
              })) : []
            };
          });
          setRequests(processedData);
          toast.success('Reimbursement requests loaded successfully!'); // Success toast
        } else {
          const errorText = await response.text(); // Get error message from response body
          setError('Failed to fetch requests.');
          console.error('Failed to fetch requests:', response.status, errorText);
          toast.error(`Failed to fetch requests: ${errorText}`); // Error toast
        }
      } catch (err) {
        setError('Error connecting to the server.');
        console.error('Error fetching requests:', err);
        toast.error('Error connecting to the server. Please check your network.'); // Error toast
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [API_BASE_URL]);


  const clearAllFilters = () => {
    setAdvancedFilters({
      status: 'All',
      requester: '',
      approver: '',
      fromDate: '',
      toDate: '',
      globalSearch: '',
    });
    setColumnFilters({});
    setPage(1);
    toast.info('All filters cleared.'); // Info toast
  };

  const applyAdvancedFilters = () => {
    setShowAdvancedFilter(false);
    setPage(1);
    toast.info('Filters applied.'); // Info toast
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
      case 'Draft': return 'status-badge gray';
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

  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // Filter by logged-in user's ID
    if (userId) { // Only apply this filter if userId is available
      result = result.filter(req => String(req.requesterId) === String(userId));
    }

    if (advancedFilters.status !== 'All') {
      result = result.filter(req => req.status === advancedFilters.status);
    }
    if (advancedFilters.requester) {
      result = result.filter(req => req.requester.toLowerCase().includes(advancedFilters.requester.toLowerCase()));
    }
    if (advancedFilters.approver) {
      result = result.filter(req => req.approver.toLowerCase().includes(advancedFilters.approver.toLowerCase()));
    }
    if (advancedFilters.fromDate) {
      result = result.filter(req => new Date(req.date) >= new Date(advancedFilters.fromDate));
    }
    if (advancedFilters.toDate) {
      result = result.filter(req => new Date(req.date) <= new Date(advancedFilters.toDate));
    }
    if (advancedFilters.globalSearch) {
      const query = advancedFilters.globalSearch.toLowerCase();
      result = result.filter(req =>
        Object.values(req).some(value => String(value).toLowerCase().includes(query))
      );
    }

    // Role-based filtering (existing logic)
    if (userRole === USER_ROLES.REQUESTER) {
      // If requester, already filtered by userId above. No additional requester filter needed here.
    } else if (userRole === USER_ROLES.APPROVER) {
      // Approvers see requests assigned to them or requests from requesters they oversee
      // For now, we'll keep the mock logic, but in a real app, this would be more complex
      // based on actual approval assignments.
      // Assuming 'Approver' in dummy data matches the role
      result = result.filter(req => req.approver === 'Approver' || req.requesterId === userId);
    }

    return result;
  }, [requests, advancedFilters, userRole, userId]); // Add userId to dependencies

  const columns = useMemo(() => [
    { key: 'id', header: <><Hash className="icon-in-label" /> Request ID</>, sortable: true, filterable: true, filterType: 'text', width: '120px' },
    { key: 'date', header: <><Calendar className="icon-in-label" /> Request Date</>, sortable: true, filterable: true, filterType: 'date', width: '150px' },
    // { key: 'requester', header: <><User className="icon-in-label" /> Requester</>, sortable: true, filterable: true, filterType: 'text', width: '150px' },
    { key: 'approver', header: <><User className="icon-in-label" /> Approver</>, sortable: true, filterable: true, filterType: 'text', width: '150px' },
    { key: 'totalAmount', header: <><DollarSign className="icon-in-label" /> Total Amount</>, sortable: true, filterable: true, filterType: 'number', render: (item) => `₹${item.totalAmount ? item.totalAmount.toFixed(2) : '0.00'}`, width: '120px' },
    {
      key: 'status',
      header: <><ListFilter className="icon-in-label" /> Status</>,
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: () => [...new Set(requests.map(req => req.status))],
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
      width: '150px',
      render: (item) => (
        <div className="table-actions">
          <button
            onClick={(e) => { e.stopPropagation(); openDocumentViewModal({ url: item.attachedBills[0]?.url, name: item.attachedBills[0]?.name, mimeType: item.attachedBills[0]?.type }); }}
            className="icon-button text-blue"
            title="View Bill"
            disabled={!item.attachedBills || item.attachedBills.length === 0}
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigateTo('reimbursement_form', { requestId: item.id, isReadOnly: false }); }}
            className="icon-button text-green"
            title="Edit Request"
            // Updated disabled logic for the Edit button
            disabled={
                (userRole === USER_ROLES.REQUESTER && !(item.status === 'Draft' || item.status === REIMBURSEMENT_STATUSES.WAITING_APPROVAL || item.status === REIMBURSEMENT_STATUSES.STAGE_1_REJECTED || item.status === REIMBURSEMENT_STATUSES.STAGE_2_REJECTED)) ||
                (userRole === USER_ROLES.APPROVER && !(item.status === REIMBURSEMENT_STATUSES.WAITING_APPROVAL || item.status === REIMBURSEMENT_STATUSES.STAGE_1_APPROVED))
            }
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              // Implement a confirmation modal instead of alert
              if (window.confirm(`Are you sure you want to delete request ${item.id}?`)) { // Keep confirm for now, but suggest custom modal
                try {
                  const response = await fetch(`${API_BASE_URL}/api/reimbursements/${item.id}`, {
                    method: 'DELETE',
                  });
                  if (response.ok) {
                    setRequests(prev => prev.filter(req => req.id !== item.id));
                    toast.success('Request deleted successfully!'); // Success toast
                  } else {
                    const errorText = await response.text();
                    toast.error(`Failed to delete request: ${errorText}`); // Error toast
                  }
                } catch (error) {
                  console.error('Error deleting request:', error);
                  toast.error('Error deleting request. Please check server connection.'); // Error toast
                }
              }
            }}
            className="icon-button text-red"
            title="Delete Request"
            disabled={item.status !== 'Draft' && item.status !== REIMBURSEMENT_STATUSES.STAGE_1_REJECTED && item.status !== REIMBURSEMENT_STATUSES.STAGE_2_REJECTED}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ], [requests, navigateTo, openDocumentViewModal, userRole, API_BASE_URL]);

  const hasActiveFilters = Object.values(advancedFilters).some(v => v !== '' && v !== 'All');

  if (loading) {
    return <div className="card-container">Loading requests...</div>;
  }

  // Display error message if there's an error and no requests to show
  if (error && requests.length === 0) {
    return <div className="card-container text-red-600">Error: {error}</div>;
  }

  return (
    <div className="card-container">
      <h2 className="section-title">List of Reimbursement Requests</h2>
      <div className="section-separator"></div>

      {/* Header with Advanced Filter Button */}
      <div className="list-header-controls">
        <h3 className="list-item-count">Showing {filteredRequests.length} Requests</h3>
        <button
          className="filter-toggle-btn"
          onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
        >
          <Filter size={18} />
          Advanced Filter
          <ChevronDown
            size={16}
            style={{
              transform: showAdvancedFilter ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </button>
      </div>

      {/* Advanced Filter Modal/Panel */}
      {showAdvancedFilter && (
        <div className="advanced-filter-overlay">
          <div className="advanced-filter-card">
            <div className="advanced-filter-header">
              <h3><ListFilter size={20} /> Advanced Filters</h3>
              <button
                className="close-btn"
                onClick={() => setShowAdvancedFilter(false)}
                aria-label="Close advanced filters"
              >
                <X size={18} />
              </button>
            </div>

            <div className="advanced-filters-grid">
              <div className="filter-group">
                <label><ListFilter className="icon-in-label" /> Status</label>
                <select
                  className="filter-input"
                  value={advancedFilters.status}
                  onChange={e => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="All">All Statuses</option>
                  {Object.values(REIMBURSEMENT_STATUSES).map(status => (
                    <option key={status} value={status}>{capitalize(status)}</option>
                  ))}
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="filter-group">
                <label><User className="icon-in-label" /> Requester</label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search requester..."
                  value={advancedFilters.requester}
                  onChange={e => setAdvancedFilters(prev => ({ ...prev, requester: e.target.value }))}
                />
              </div>

              <div className="filter-group">
                <label><User className="icon-in-label" /> Approver</label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search approver..."
                  value={advancedFilters.approver}
                  onChange={e => setAdvancedFilters(prev => ({ ...prev, approver: e.target.value }))}
                />
              </div>

              <div className="filter-group">
                <label><Calendar className="icon-in-label" /> From Date</label>
                <input
                  type="date"
                  className="filter-input"
                  value={advancedFilters.fromDate}
                  onChange={e => setAdvancedFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                />
              </div>

              <div className="filter-group">
                <label><Calendar className="icon-in-label" /> To Date</label>
                <input
                  type="date"
                  className="filter-input"
                  value={advancedFilters.toDate}
                  onChange={e => setAdvancedFilters(prev => ({ ...prev, toDate: e.target.value }))}
                />
              </div>

              <div className="filter-group full-width">
                <label><Search className="icon-in-label" /> Global Search</label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search all fields (ID, amount, etc.)..."
                  value={advancedFilters.globalSearch}
                  onChange={e => setAdvancedFilters(prev => ({ ...prev, globalSearch: e.target.value }))}
                />
              </div>
            </div>

            <div className="advanced-filter-actions">
              <button className="btn-secondary" onClick={clearAllFilters}>
                Clear All Filters
              </button>
              <button
                className="btn-primary"
                onClick={applyAdvancedFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="active-filters">
          <span className="active-filters-label">Active Filters:</span>
          <div className="filter-tags-container">
            {Object.entries(advancedFilters).map(([key, value]) => {
              if (!value || value === 'All') return null;

              let displayKey = capitalize(key);
              if (key === 'fromDate') displayKey = 'From Date';
              if (key === 'toDate') displayKey = 'To Date';
              if (key === 'globalSearch') displayKey = 'Global Search';

              let displayValue = capitalize(value);
              if (key === 'fromDate' || key === 'toDate') displayValue = value;

              return (
                <span key={key} className="filter-tag">
                  {displayKey}: {displayValue}
                  <button
                    onClick={() => {
                      setAdvancedFilters(prev => ({ ...prev, [key]: (key === 'status' ? 'All' : '') }));
                      setPage(1);
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            <button className="clear-all-tag" onClick={clearAllFilters}>
              Clear All <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Request List Table */}
      <div className="overflow-x-auto">
        <TableComponent
          data={filteredRequests}
          columns={columns}
          sortField={sortField}
          setSortField={setSortField}
          sortAsc={sortAsc}
          setSortAsc={setSortAsc}
          page={page}
          setPage={setPage}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          // Removed onRowClick to prevent automatic navigation
          emptyMessage="No requests found matching your criteria."
          pageSize={10}
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
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default RequestList;
