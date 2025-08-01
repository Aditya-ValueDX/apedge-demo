// src/pages/Reports.js
import React, { useState, useMemo } from 'react';
import { Download, Filter, BarChart2, PieChart, Calendar, User, ListFilter, DollarSign, Hash, Search, X, ChevronDown, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { USER_ROLES, REIMBURSEMENT_STATUSES, BILL_TYPES } from '../utils/config';
import TableComponent from '../components/TableComponent';
import ViewDocumentModal from '../components/ViewDocumentModal';

const Reports = ({ navigateTo, userRole }) => {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'All',
    requester: '',
    approver: '',
    fromDate: '',
    toDate: '',
    billType: 'All',
    globalSearch: '',
  });

  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileForModal, setSelectedFileForModal] = useState(null);

  // Dummy data for Admin's reports (all data)
  const dummyReportData = useMemo(() => [
    { id: 'RPT001', date: '2024-07-01', user: 'Alice Brown', amount: 150, approver: 'John Doe', status: 'Processed', billType: 'Travel' },
    { id: 'RPT002', date: '2024-07-05', user: 'Bob White', amount: 75, approver: 'Jane Smith', status: 'Waiting Approval', billType: 'Food' },
    { id: 'RPT003', date: '2024-07-10', user: 'Alice Brown', amount: 200, approver: 'John Doe', status: 'Stage 1 Approved', billType: 'Office Supplies' },
    { id: 'RPT004', date: '2024-07-12', user: 'Charlie Green', amount: 50, approver: 'Jane Smith', status: 'Rejected', billType: 'Travel' },
    { id: 'RPT005', date: '2024-06-20', user: 'Alice Brown', amount: 120, approver: 'John Doe', status: 'Processed', billType: 'Food' },
    { id: 'RPT006', date: '2024-06-25', user: 'Bob White', amount: 300, approver: 'Robert Johnson', status: 'Processed', billType: 'Software' },
    { id: 'RPT007', date: '2024-05-15', user: 'Charlie Green', amount: 90, approver: 'Jane Smith', status: 'Processed', billType: 'Utilities' },
  ], []);

  const clearAllFilters = () => {
    setAdvancedFilters({
      status: 'All',
      requester: '',
      approver: '',
      fromDate: '',
      toDate: '',
      billType: 'All',
      globalSearch: '',
    });
    setColumnFilters({});
    setPage(1);
  };

  const applyAdvancedFilters = () => {
    setShowAdvancedFilter(false);
    setPage(1);
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

  const filteredReports = useMemo(() => {
    let result = [...dummyReportData];

    const { status, requester, approver, fromDate, toDate, billType, globalSearch } = advancedFilters;

    const reportDate = (dateString) => new Date(dateString);

    if (status !== 'All') {
      result = result.filter(report => report.status === status);
    }
    if (requester) {
      result = result.filter(report => report.user.toLowerCase().includes(requester.toLowerCase()));
    }
    if (approver) {
      result = result.filter(report => report.approver.toLowerCase().includes(approver.toLowerCase()));
    }
    if (fromDate) {
      result = result.filter(report => reportDate(report.date) >= reportDate(fromDate));
    }
    if (toDate) {
      result = result.filter(report => reportDate(report.date) <= reportDate(toDate));
    }
    if (billType !== 'All') {
      result = result.filter(report => report.billType === billType);
    }
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      result = result.filter(report =>
        Object.values(report).some(value => String(value).toLowerCase().includes(query))
      );
    }
    return result;
  }, [dummyReportData, advancedFilters]);

  const allBillTypes = useMemo(() => ['All', ...BILL_TYPES], []);
  const allStatuses = useMemo(() => ['All', ...Object.values(REIMBURSEMENT_STATUSES)], []);

  const monthlySpendData = useMemo(() => {
    return filteredReports.reduce((acc, report) => {
      const month = new Date(report.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + report.amount;
      return acc;
    }, {});
  }, [filteredReports]);

  const chartData = useMemo(() => Object.keys(monthlySpendData).map(month => ({
    month,
    amount: monthlySpendData[month],
  })), [monthlySpendData]);

  const billTypeSpendData = useMemo(() => {
    return filteredReports.reduce((acc, report) => {
      acc[report.billType] = (acc[report.billType] || 0) + report.amount;
      return acc;
    }, {});
  }, [filteredReports]);

  const pieChartData = useMemo(() => Object.keys(billTypeSpendData).map(type => ({
    name: type,
    value: billTypeSpendData[type],
  })), [billTypeSpendData]);

  const COLORS = useMemo(() => ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'], []);

  const handleDownloadPDF = () => {
    console.log('Downloading PDF report...');
    alert('PDF download functionality is not implemented yet.');
  };

  const handleDownloadExcel = () => {
    console.log('Downloading Excel report...');
    alert('Excel download functionality is not implemented yet.');
  };

  const hasActiveFilters = Object.values(advancedFilters).some(v => v !== '' && v !== 'All');

  const reportTableColumns = useMemo(() => [
    { key: 'id', header: <><Hash className="icon-in-label" /> ID</>, sortable: true, filterable: false, filterType: 'text', width: '100px' },
    { key: 'date', header: <><Calendar className="icon-in-label" /> Date</>, sortable: true, filterable: false, filterType: 'date', width: '120px' },
    { key: 'user', header: <><User className="icon-in-label" /> User</>, sortable: true, filterable: false, filterType: 'text', width: '150px' },
    { key: 'amount', header: <><DollarSign className="icon-in-label" /> Amount</>, sortable: true, filterable: false, filterType: 'number', render: (item) => `₹${item.amount.toFixed(2)}`, width: '100px' },
    { key: 'approver', header: <><User className="icon-in-label" /> Approver</>, sortable: true, filterable: false, filterType: 'text', width: '150px' },
    { key: 'billType', header: <><FileText className="icon-in-label" /> Bill Type</>, sortable: true, filterable: false, filterType: 'text', render: (item) => capitalize(item.billType), width: '130px' },
    {
      key: 'status',
      header: <><ListFilter className="icon-in-label" /> Status</>,
      sortable: true,
      filterable: false,
      filterType: 'select',
      filterOptions: () => allStatuses,
      render: (item) => (
        <span className={getStatusClass(item.status)}>
          {capitalize(item.status)}
        </span>
      ),
      width: '150px'
    },
  ], [allStatuses]);


  // Conditional rendering for access control - MOVED AFTER HOOKS
  if (userRole !== USER_ROLES.ADMIN) { // Only Admin can access this page
    return (
      <div className="text-center py-10 text-red-600 font-bold text-xl">
        Access Denied: You do not have permission to view this page.
      </div>
    );
  }


  return (
    <div className="card-container">
      <h2 className="section-title">Admin Reimbursement Reports</h2> {/* Changed title */}
      <div className="section-separator"></div>

      {/* Header with Advanced Filter Button */}
      <div className="list-header-controls">
        <h3 className="list-item-count">Showing {filteredReports.length} Reports</h3>
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
                  {allStatuses.map(status => (
                    <option key={status} value={status}>{capitalize(status)}</option>
                  ))}
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

              <div className="filter-group">
                <label><FileText className="icon-in-label" /> Bill Type</label>
                <select
                  className="filter-input"
                  value={advancedFilters.billType}
                  onChange={e => setAdvancedFilters(prev => ({ ...prev, billType: e.target.value }))}
                >
                  {allBillTypes.map(type => (
                    <option key={type} value={type}>{capitalize(type)}</option>
                  ))}
                </select>
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
              if (key === 'billType') displayKey = 'Bill Type';


              let displayValue = capitalize(value);
              if (key === 'fromDate' || key === 'toDate') displayValue = value;

              return (
                <span key={key} className="filter-tag">
                  {displayKey}: {displayValue}
                  <button
                    onClick={() => {
                      setAdvancedFilters(prev => ({ ...prev, [key]: (key === 'status' || key === 'billType' ? 'All' : '') }));
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

      {/* Data Visualization */}
      <h3 className="section-title">Visualizations</h3>
      <div className="chart-grid">
        <div className="chart-card">
          <h4 className="chart-title">Monthly Spend Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" style={{ fill: '#555' }} />
              <YAxis style={{ fill: '#555' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="amount" fill="#8884d8" name="Amount (₹)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h4 className="chart-title">Spend by Bill Type</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 44px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report List Table */}
      <h3 className="section-title">Detailed Report</h3>
      <div className="overflow-x-auto">
        <TableComponent
          data={filteredReports}
          columns={reportTableColumns}
          sortField={sortField}
          setSortField={setSortField}
          sortAsc={sortAsc}
          setSortAsc={setSortAsc}
          page={page}
          setPage={setPage}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          emptyMessage="No report data found matching your criteria."
          pageSize={10}
        />
      </div>

      {/* View Document Modal (for potential future use, or if report items linked to documents) */}
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

export default Reports;
