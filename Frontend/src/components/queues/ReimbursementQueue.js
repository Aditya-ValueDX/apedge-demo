import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import {
    Search, Filter, X, ChevronDown, Calendar, FileText,
    User, Hash, DollarSign, Clock, ListFilter
} from 'lucide-react';
import '../styles/ExtractionQueue.css'; // Apply shared queue styles
import { BASE_URL } from '../../config'; // Import BASE_URL

const PAGE_SIZE = 10;

const ReimbursementQueue = () => {
    const [reimbursements, setReimbursements] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [page, setPage] = useState(1);
    const [sortField, setSortField] = useState('submissionDate');
    const [sortAsc, setSortAsc] = useState(false);
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [activeTab, setActiveTab] = useState('pending'); // Default to 'pending'
    const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0 }); // New state for counts

    const navigate = useNavigate();
    const location = useLocation(); // Get location object

    // Effect to read 'tab' query parameter from URL and set activeTab
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tabFromUrl = queryParams.get('tab');
        if (tabFromUrl && ['pending', 'approved', 'rejected'].includes(tabFromUrl)) {
            setActiveTab(tabFromUrl);
        } else {
            // If no valid tab parameter, ensure it defaults to 'pending'
            setActiveTab('pending');
        }
    }, [location.search]); // Re-run when URL search params change

    const [columnFilters, setColumnFilters] = useState({
        id: '',
        employeeName: '',
        submissionDate: '',
        status: '', // Keep status for the 'All' tab if introduced, or remove if tabs handle status
        amount: '',
    });

    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        employeeName: '',
        status: '', // Keep status for the 'All' tab if introduced
        amount_min: '',
        amount_max: '',
    });

    useEffect(() => {
        const fetchReimbursementData = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/reimbursements`);
                const data = await response.json();

                // Format all data; filtering by status will happen in useMemo
                const formattedData = data.map(item => ({
                    id: item.id,
                    employeeName: item.employeeName || 'N/A',
                    amount: parseFloat(item.amount) || 0,
                    submissionDate: item.submissionDate || new Date().toISOString().split('T')[0],
                    status: item.status || 'pending', // Default to pending if status is missing
                    description: item.description || '',
                    receiptUrl: item.receiptUrl || ''
                }));

                setReimbursements(formattedData);

                // Calculate and set status counts
                const counts = formattedData.reduce((acc, item) => {
                    const status = item.status?.toLowerCase();
                    if (status in acc) {
                        acc[status]++;
                    }
                    return acc;
                }, { pending: 0, approved: 0, rejected: 0 });
                setStatusCounts(counts);

            } catch (error) {
                console.error('Failed to fetch reimbursement data:', error);
            }
        };
        fetchReimbursementData();
    }, []);

    const filteredAndSortedReimbursements = useMemo(() => {
        let result = [...reimbursements];

        // Apply tab-based filtering first
        if (activeTab === 'pending') {
            result = result.filter(item => item.status?.toLowerCase() === 'pending');
        } else if (activeTab === 'approved') {
            result = result.filter(item => item.status?.toLowerCase() === 'approved');
        } else if (activeTab === 'rejected') {
            result = result.filter(item => item.status?.toLowerCase() === 'rejected');
        }
        // If 'All' tab is added, no initial status filter is applied here.

        // Apply column filters
        Object.entries(columnFilters).forEach(([key, value]) => {
            if (value) {
                result = result.filter(item => {
                    const itemValue = item[key]?.toString().toLowerCase() || '';
                    if (key === 'submissionDate') {
                        return itemValue.includes(value.toLowerCase().split('T')[0]);
                    }
                    if (key === 'amount') {
                        const amount = parseFloat(item.amount);
                        const filterVal = parseFloat(value);
                        return !isNaN(amount) && !isNaN(filterVal) && amount.toString().includes(filterVal.toString());
                    }
                    return itemValue.includes(value.toLowerCase());
                });
            }
        });

        // Apply advanced filters
        // Note: The status filter in advanced filters might conflict with tab filtering.
        // For simplicity, if a tab is active, its status filter takes precedence.
        // If 'All Statuses' is selected in advanced filter, it won't override the tab.
        if (filters.status && activeTab === 'all') { // Only apply if 'All' tab is active and status is explicitly selected
            result = result.filter(item => item.status === filters.status);
        }
        if (filters.employeeName) {
            result = result.filter(item => item.employeeName.toLowerCase().includes(filters.employeeName.toLowerCase()));
        }
        if (filters.from_date) {
            result = result.filter(item => new Date(item.submissionDate) >= new Date(filters.from_date));
        }
        if (filters.to_date) {
            result = result.filter(item => new Date(item.submissionDate) <= new Date(filters.to_date));
        }
        if (filters.amount_min) {
            result = result.filter(item => item.amount >= parseFloat(filters.amount_min));
        }
        if (filters.amount_max) {
            result = result.filter(item => item.amount <= parseFloat(filters.amount_max));
        }

        // Apply sorting
        result.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            if (sortField === 'submissionDate') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else if (sortField === 'amount') {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            } else {
                return sortAsc ? aVal - bVal : bVal - aVal;
            }
        });

        return result;
    }, [reimbursements, columnFilters, filters, sortField, sortAsc, activeTab]); // Added activeTab to dependencies

    useEffect(() => {
        setFiltered(filteredAndSortedReimbursements);
        setPage(1);
    }, [filteredAndSortedReimbursements]);

    const paginatedData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortAsc(prev => !prev);
        } else {
            setSortField(field);
            setSortAsc(true);
        }
    };

    const clearAllFilters = () => {
        setFilters({ from_date: '', to_date: '', employeeName: '', status: '', amount_min: '', amount_max: '' });
        setColumnFilters({ id: '', employeeName: '', submissionDate: '', status: '', amount: '' });
    };

    const hasActiveFilters = Object.values(filters).some(v => v) || Object.values(columnFilters).some(v => v);

    const getUniqueValues = (field) => {
        // Filter unique values based on the currently active tab's data
        const currentTabReimbursements = reimbursements.filter(item => {
            if (activeTab === 'pending') return item.status?.toLowerCase() === 'pending';
            if (activeTab === 'approved') return item.status?.toLowerCase() === 'approved';
            if (activeTab === 'rejected') return item.status?.toLowerCase() === 'rejected';
            return true; // For 'all' or other cases
        });
        return [...new Set(currentTabReimbursements.map(item => item[field]).filter(val => val !== null && val !== undefined && val !== ''))];
    };

    const statusColor = (status) => {
        switch (status?.toLowerCase()) { // Use optional chaining and toLowerCase for safety
            case 'pending':
                return '#f59e0b'; // Warning yellow
            case 'approved':
                return '#10b981'; // Success green
            case 'rejected':
                return '#ef4444'; // Error red
            case 'submitted': // If 'submitted' is a distinct status
                return '#6366f1'; // Primary blue
            default:
                return '#9ca3af'; // Gray
        }
    };

    const getPaginationRange = (current, total) => {
        const range = [];
        if (total <= 5) {
            for (let i = 1; i <= total; i++) range.push(i);
        } else {
            if (current <= 3) {
                range.push(1, 2, 3, 4, '...', total);
            } else if (current >= total - 2) {
                range.push(1, '...', total - 3, total - 2, total - 1, total);
            } else {
                range.push(1, '...', current - 1, current, current + 1, '...', total);
            }
        }
        return range;
    };

    const capitalizeStatus = (status) => {
        if (!status) return '';
        return String(status)
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="processing-queue">
            <div className="queue-header">
                Reimbursement Queue
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

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button
                    className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending {/* The styling for .status-count is handled in ExtractionQueue.css */}
                    <span className="status-count">{statusCounts.pending}</span>
                </button>
                <button
                    className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('approved')}
                >
                    Approved {/* The styling for .status-count is handled in ExtractionQueue.css */}
                    <span className="status-count">{statusCounts.approved}</span>
                </button>
                <button
                    className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    Rejected {/* The styling for .status-count is handled in ExtractionQueue.css */}
                    <span className="status-count">{statusCounts.rejected}</span>
                </button>
            </div>

            {/* Advanced Filter Panel Overlay */}
            {showAdvancedFilter && (
                <div className="modal-overlay">
                    <div className="advanced-filter-panel">
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
                                <label><User size={14} /> Employee Name</label>
                                <input
                                    type="text"
                                    placeholder="Search employee..."
                                    value={filters.employeeName}
                                    onChange={e => setFilters(prev => ({ ...prev, employeeName: e.target.value }))}
                                />
                            </div>

                            <div className="filter-group">
                                <label><Calendar size={14} /> From Date</label>
                                <input
                                    type="date"
                                    value={filters.from_date}
                                    onChange={e => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
                                />
                            </div>

                            <div className="filter-group">
                                <label><Calendar size={14} /> To Date</label>
                                <input
                                    type="date"
                                    value={filters.to_date}
                                    onChange={e => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
                                />
                            </div>

                            <div className="filter-group">
                                <label><span className="status-dot-label"></span> Status</label>
                                <select
                                    value={filters.status}
                                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="">All Statuses</option>
                                    {getUniqueValues('status').map(status => (
                                        <option key={status} value={status}>{capitalizeStatus(status)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label><DollarSign size={14} /> Min Amount</label>
                                <input
                                    type="number"
                                    placeholder="Min amount..."
                                    value={filters.amount_min}
                                    onChange={e => setFilters(prev => ({ ...prev, amount_min: e.target.value }))}
                                />
                            </div>

                            <div className="filter-group">
                                <label><DollarSign size={14} /> Max Amount</label>
                                <input
                                    type="number"
                                    placeholder="Max amount..."
                                    value={filters.amount_max}
                                    onChange={e => setFilters(prev => ({ ...prev, amount_max: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="advanced-filter-actions">
                            <button className="clear-btn" onClick={clearAllFilters}>
                                Clear All Filters
                            </button>
                            <button
                                className="apply-btn"
                                onClick={() => setShowAdvancedFilter(false)}
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
                    <div className="filter-tags">
                        {Object.entries({ ...filters, ...columnFilters }).map(([key, value]) => {
                            if (!value) return null;

                            let displayKey = key.replace(/_/g, ' ');
                            if (displayKey === 'amount min') displayKey = 'Min Amount';
                            if (displayKey === 'amount max') displayKey = 'Max Amount';
                            if (displayKey === 'from date') displayKey = 'From Date';
                            if (displayKey === 'to date') displayKey = 'To Date';
                            if (displayKey === 'submissionDate') displayKey = 'Submission Date';
                            if (displayKey === 'employeeName') displayKey = 'Employee Name';

                            let displayValue = value;
                            if (key === 'status') displayValue = capitalizeStatus(value);

                            return (
                                <span key={key} className="filter-tag">
                                    {capitalizeStatus(displayKey)}: {displayValue}
                                    <button
                                        onClick={() => {
                                            if (key in filters) {
                                                setFilters(prev => ({ ...prev, [key]: '' }));
                                            } else {
                                                setColumnFilters(prev => ({ ...prev, [key]: '' }));
                                            }
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

            {/* Table */}
            <div className="table-container">
                <table className="queue-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>
                                <div className="th-content">
                                    <div>Sr No</div>
                                </div>
                            </th>
                            <th style={{ width: '120px' }}>
                                <div className="th-content">
                                    <div onClick={() => toggleSort('id')}>
                                        <Hash size={14} /> ID {sortField === 'id' ? (sortAsc ? '↑' : '↓') : ''}
                                    </div>
                                    <div className="column-filter-row">
                                        <Search size={12} />
                                        <input
                                            type="text"
                                            placeholder="Filter ID..."
                                            value={columnFilters.id}
                                            onChange={e => setColumnFilters(prev => ({ ...prev, id: e.target.value }))}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            </th>
                            <th style={{ width: '150px' }}>
                                <div className="th-content">
                                    <div onClick={() => toggleSort('employeeName')}>
                                        <User size={14} /> Employee Name {sortField === 'employeeName' ? (sortAsc ? '↑' : '↓') : ''}
                                    </div>
                                    <div className="column-filter-row">
                                        <Search size={12} />
                                        <input
                                            type="text"
                                            placeholder="Filter employee..."
                                            value={columnFilters.employeeName}
                                            onChange={e => setColumnFilters(prev => ({ ...prev, employeeName: e.target.value }))}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            </th>
                            
                            <th style={{ width: '120px' }}>
                                <div className="th-content">
                                    <div onClick={() => toggleSort('amount')}>
                                        <DollarSign size={14} /> Amount {sortField === 'amount' ? (sortAsc ? '↑' : '↓') : ''}
                                    </div>
                                    <div className="column-filter-row">
                                        <Search size={12} />
                                        <input
                                            type="number"
                                            placeholder="Filter amount..."
                                            value={columnFilters.amount}
                                            onChange={e => setColumnFilters(prev => ({ ...prev, amount: e.target.value }))}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            </th>
                            <th style={{ width: '150px' }}>
                                <div className="th-content">
                                    <div onClick={() => toggleSort('submissionDate')}>
                                        <Calendar size={14} /> Submission Date {sortField === 'submissionDate' ? (sortAsc ? '↑' : '↓') : ''}
                                    </div>
                                    <div className="column-filter-row">
                                        <Search size={12} />
                                        <input
                                            type="date"
                                            placeholder="Filter date..."
                                            value={(columnFilters.submissionDate || '').split('T')[0]}
                                            onChange={e => setColumnFilters(prev => ({ ...prev, submissionDate: e.target.value }))}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            </th>
                            <th style={{ width: '120px' }}>
                                <div className="th-content">
                                    <div onClick={() => toggleSort('status')}>
                                        <span className="status-dot-label"></span> Status {sortField === 'status' ? (sortAsc ? '↑' : '↓') : ''}
                                    </div>
                                    <div className="column-filter-row">
                                        {/* Removed status filter from column filters as tabs handle it */}
                                    </div>
                                </div>
                            </th>
                            <th style={{ width: '80px' }}>
                                <div className="th-content">
                                    <div>Action</div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                                    <td>{item.id}</td>
                                    <td>{item.employeeName}</td>
                                    <td>{item.amount ? `₹${item.amount.toLocaleString('en-IN')}` : '—'}</td>
                                    <td>{item.submissionDate ? new Date(item.submissionDate).toLocaleDateString('en-GB') : '—'}</td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{
                                                backgroundColor: statusColor(item.status) + '20',
                                                color: statusColor(item.status),
                                                border: `1px solid ${statusColor(item.status)}40`
                                            }}
                                        >
                                            {capitalizeStatus(item.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => navigate(`/view-reimbursement/${item.id}?from=${item.status}`)}
                                            className="view-button"
                                        >
                                            View
                                        </button>

                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-500)' }}>
                                    No {activeTab} reimbursements found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    ‹
                </button>

                {getPaginationRange(page, Math.ceil(filtered.length / PAGE_SIZE)).map((pg, idx) => (
                    <button
                        key={idx}
                        disabled={pg === '...'}
                        className={`page-btn ${pg === page ? 'active' : ''}`}
                        onClick={() => typeof pg === 'number' && setPage(pg)}
                    >
                        {pg}
                    </button>
                ))}

                <button
                    onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / PAGE_SIZE), p + 1))}
                    disabled={page === Math.ceil(filtered.length / PAGE_SIZE) || filtered.length === 0}
                >
                    ›
                </button>
            </div>
        </div>
    );
};

export default ReimbursementQueue;
