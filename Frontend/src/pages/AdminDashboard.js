// src/pages/AdminDashboard.js
import React, { useState, useMemo } from 'react';
import { Settings, Users, FileText, DollarSign, CloudUpload, BarChart2, PieChart, List, Clock } from 'lucide-react';
import { USER_ROLES, REIMBURSEMENT_STATUSES, BILL_TYPES, API_BASE_URL } from '../utils/config';
import TableComponent from '../components/TableComponent';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const AdminDashboard = ({ navigateTo, userRole }) => {
  // Dummy data for admin dashboard
  const summaryData = {
    totalRequests: 150,
    totalAmountReimbursed: 75000.00,
    pendingApprovalCount: 20,
    processedCount: 100,
    errorCount: 5,
    usersCount: 50,
  };

  // Dummy data for recent system activity (e.g., recent processed requests)
  const [recentSystemActivity] = useState([
    { id: 'SYS001', date: '2024-07-25', description: 'REQ003 processed to ERP', status: 'Success' },
    { id: 'SYS002', date: '2024-07-24', description: 'New user registered: John Doe', status: 'Info' },
    { id: 'SYS003', date: '2024-07-23', description: 'ERP upload failed for REQ008', status: 'Error' },
    { id: 'SYS004', date: '2024-07-22', description: 'Master data updated by Admin', status: 'Info' },
    { id: 'SYS005', date: '2024-07-21', description: 'REQ001 approved by Approver', status: 'Success' },
  ]);

  // Data for charts (reusing from Reports.js logic for consistency)
  const monthlySpendData = useMemo(() => {
    // In a real admin dashboard, this would aggregate ALL data, not just filtered.
    const allProcessedReports = [
      { date: '2024-07-01', amount: 150 }, { date: '2024-07-05', amount: 75 },
      { date: '2024-06-20', amount: 120 }, { date: '2024-06-25', amount: 300 },
      { date: '2024-05-15', amount: 90 }, { date: '2024-07-15', amount: 200 },
    ];
    return allProcessedReports.reduce((acc, report) => {
      const month = new Date(report.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + report.amount;
      return acc;
    }, {});
  }, []);

  const chartData = useMemo(() => Object.keys(monthlySpendData).map(month => ({
    month,
    amount: monthlySpendData[month],
  })), [monthlySpendData]);

  const billTypeSpendData = useMemo(() => {
    const allBillTypeData = [
      { billType: 'Travel', amount: 150 }, { billType: 'Food', amount: 75 },
      { billType: 'Office Supplies', amount: 200 }, { billType: 'Travel', amount: 50 },
      { billType: 'Food', amount: 120 }, { billType: 'Software', amount: 300 },
      { billType: 'Utilities', amount: 90 },
    ];
    return allBillTypeData.reduce((acc, report) => {
      acc[report.billType] = (acc[report.billType] || 0) + report.amount;
      return acc;
    }, {});
  }, []);

  const pieChartData = useMemo(() => Object.keys(billTypeSpendData).map(type => ({
    name: type,
    value: billTypeSpendData[type],
  })), [billTypeSpendData]);

  const COLORS = useMemo(() => ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'], []);


  const getStatusClass = (status) => {
    switch (status) {
      case 'Success': return 'status-badge green';
      case 'Error': return 'status-badge red';
      case 'Info': return 'status-badge blue'; // Assuming a blue badge for info status
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

  // Columns for the TableComponent for recent system activity
  const recentActivityColumns = useMemo(() => [
    { key: 'id', header: 'Activity ID', sortable: true, filterable: false, width: '100px' },
    { key: 'date', header: 'Date', sortable: true, filterable: false, width: '120px' },
    { key: 'description', header: 'Description', sortable: false, filterable: false, width: 'auto' },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: false,
      render: (item) => (
        <span className={getStatusClass(item.status)}>
          {capitalize(item.status)}
        </span>
      ),
      width: '100px'
    },
  ], []);

  // State for TableComponent's internal sorting and pagination
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});

  return (
    <div className="card-container">
      <h2 className="section-title">Admin Dashboard</h2>
      <div className="section-separator"></div>

      {/* Summary Cards for Admin */}
      <div className="dashboard-summary-grid">
        <div className="summary-card blue">
          <div>
            <div className="summary-card-value">{summaryData.totalRequests}</div>
            <div className="summary-card-label">Total Requests</div>
          </div>
          <List className="summary-card-icon" />
        </div>
        <div className="summary-card green">
          <div>
            <div className="summary-card-value">₹{summaryData.totalAmountReimbursed.toFixed(2)}</div>
            <div className="summary-card-label">Total Reimbursed</div>
          </div>
          <DollarSign className="summary-card-icon" />
        </div>
        <div className="summary-card yellow">
          <div>
            <div className="summary-card-value">{summaryData.pendingApprovalCount}</div>
            <div className="summary-card-label">Pending Approvals</div>
          </div>
          <Clock className="summary-card-icon" />
        </div>
        <div className="summary-card purple">
          <div>
            <div className="summary-card-value">{summaryData.usersCount}</div>
            <div className="summary-card-label">Total Users</div>
          </div>
          <Users className="summary-card-icon" />
        </div>
      </div>

      {/* Quick Actions / Links */}
      {/* <div className="action-button-center" style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigateTo('erp_integration')}
          className="btn-primary"
        >
          <CloudUpload className="nav-icon" /> ERP Integration
        </button>
        <button
          onClick={() => navigateTo('master_data')}
          className="btn-secondary"
          style={{ marginLeft: '16px' }}
        >
          <Settings className="nav-icon" /> Master Data
        </button>
        <button
          onClick={() => navigateTo('reports')}
          className="btn-secondary"
          style={{ marginLeft: '16px' }}
        >
          <BarChart2 className="nav-icon" /> View Reports
        </button>
      </div> */}

      {/* Data Visualization for Admin */}
      <h3 className="section-title">System Overview Visuals</h3>
      <div className="chart-grid">
        <div className="chart-card">
          <h4 className="chart-title">Monthly Spend Trend (All Data)</h4>
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
          <h4 className="chart-title">Spend by Bill Type (All Data)</h4>
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
              <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent System Activity Table */}
      <h3 className="section-title">Recent System Activity</h3>
      <div className="overflow-x-auto">
        <TableComponent
          data={recentSystemActivity}
          columns={recentActivityColumns}
          sortField={sortField}
          setSortField={setSortField}
          sortAsc={sortAsc}
          setSortAsc={setSortAsc}
          page={page}
          setPage={setPage}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          emptyMessage="No recent system activity found."
          pageSize={5}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
