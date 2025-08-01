import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, X, ChevronDown, Calendar, FileText,
  User, Hash, DollarSign, Clock, ListFilter
} from 'lucide-react';
import '../styles/ExtractionQueue.css'; // Assuming your styles are here
import { BASE_URL } from '../../config'; // Import BASE_URL

const PAGE_SIZE = 10;

const ReconQueue = () => {
  const [files, setFiles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false); // Default to descending for 'created_at'
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // Column filters
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    invoice_number: '',
    vendor: '',
    created_at: '',
    status: '',
    total_amount: '',
  });

  // Advanced filters
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    vendor: '',
    status: '',
    amount_min: '',
    amount_max: '',
  });

  const navigate = useNavigate();

  // Fetch data
  useEffect(() => {
    const fetchReconData = async () => {
      try {
        const [reconRes, invRes] = await Promise.all([
          fetch(`${BASE_URL}/api/reconciliation`),
          fetch(`${BASE_URL}/api/invoices`) 
        ]);

        const reconciliationData = await reconRes.json();
        const allInvoices = await invRes.json();

        const formatted = reconciliationData
          .filter(entry => entry.result?.status !== 'verified') // Only show if status is not 'verified'
          .map((entry, idx) => {
            const relatedInvoice = allInvoices.find(inv => inv.id === entry.invoiceId); // Find the original invoice
            return {
              id: entry.invoiceId || `INV-${idx + 1}`,
              invoice_number: entry.invoiceNumber || relatedInvoice?.fileName?.split('.')[0] || `N/A-${idx + 1}`,
              vendor: entry.vendor || entry.result?.["Party & Address Information"]?.Vendor_Name?.Invoice_Value || relatedInvoice?.vendor || 'Unknown Vendor', // Modified line
              total_amount: parseFloat(entry.amount) || 0,
              invoice_date: entry.date || relatedInvoice?.date?.split('T')[0] || '',
              created_at: entry.timestamp || relatedInvoice?.date || new Date().toISOString(),
              // match_confidence is not directly in reconciliation.json, assume from backend for now or remove if not applicable
              match_confidence: entry.match_confidence || 85 + (idx % 15),
              status: entry.result?.status || 'extracted',
              filePath: relatedInvoice?.filePath || '' // Add filePath for potential viewing
            };
          });
        setFiles(formatted);
      } catch (error) {
        console.error('Failed to fetch reconciliation data:', error);
      }
    };

    fetchReconData();
  }, []);

  // Apply all filters and sorting
  const filteredAndSortedDocuments = useMemo(() => {
    let result = [...files];

    // Apply column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      // Only apply filter if value is not empty
      if (value) {
        result = result.filter(doc => {
          const docValue = doc[key]?.toString().toLowerCase() || '';
          if (key === 'created_at' || key === 'invoice_date') {
            return docValue.includes(value.toLowerCase().split('T')[0]);
          }
          if (key === 'total_amount') {
            const amount = parseFloat(doc.total_amount);
            const filterVal = parseFloat(value);
            return !isNaN(amount) && !isNaN(filterVal) && amount.toString().includes(filterVal.toString());
          }
          return docValue.includes(value.toLowerCase());
        });
      }
    });

    // Apply advanced filters
    if (filters.status) {
      result = result.filter(f => f.status === filters.status);
    }
    if (filters.vendor) {
      result = result.filter(f => f.vendor.toLowerCase().includes(filters.vendor.toLowerCase()));
    }
    if (filters.from_date) {
      result = result.filter(f => new Date(f.created_at?.split('T')[0]) >= new Date(filters.from_date));
    }
    if (filters.to_date) {
      result = result.filter(f => new Date(f.created_at?.split('T')[0]) <= new Date(filters.to_date));
    }
    if (filters.amount_min) {
      result = result.filter(f => f.total_amount >= parseFloat(filters.amount_min));
    }
    if (filters.amount_max) {
      result = result.filter(f => f.total_amount <= parseFloat(filters.amount_max));
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'invoice_date' || sortField === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sortField === 'total_amount') {
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
  }, [files, columnFilters, filters, sortField, sortAsc]);

  useEffect(() => {
    setFiltered(filteredAndSortedDocuments);
    setPage(1);
  }, [filteredAndSortedDocuments]);

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
    setFilters({ from_date: '', to_date: '', vendor: '', status: '', amount_min: '', amount_max: '' });
    setColumnFilters({ id: '', invoice_number: '', vendor: '', created_at: '', status: '', total_amount: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || Object.values(columnFilters).some(v => v);

  const getUniqueValues = (field) => {
    return [...new Set(files.map(file => file[field]).filter(val => val !== null && val !== undefined && val !== ''))];
  };

  const statusColor = (status) => {
    switch (status) {
      case 'queued for matching':
        return '#f39c12';
      case 'extracted':
        return '#3498db';
      case 'reconciled':
        return '#8e44ad';
      case 'verified':
        return '#27ae60';
      case 'rejected':
        return '#e74c3c';
      default:
        return '#95a5a6';
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

  const getStatusDots = (status) => {
    // Corrected steps to reflect the reconciliation flow more accurately
    const steps = ['extracted', 'reconciled', 'verified', 'rejected'];
    const currentStepIndex = steps.findIndex(step => status.toLowerCase().includes(step.toLowerCase()));

    return (
      <div className="status-tracker">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isRejected = status.toLowerCase() === 'rejected' && step.toLowerCase() === 'rejected';
          const dotColor = isRejected ? '#e74c3c' : (isCompleted ? '#27ae60' : '#d1d5db'); // Green for completed, red for rejected

          return (
            <div key={step} className="tracker-step">
              <div className="tooltip-wrapper">
                <div className={`dot ${isCompleted ? 'filled' : ''}`} style={{backgroundColor: dotColor, borderColor: dotColor}}>
                </div>
                <span className="tooltip-text">
                  {capitalizeStatus(step)}
                </span>
              </div>
              {index !== steps.length - 1 && (
                <div className={`line ${index < currentStepIndex ? 'active' : ''}`} style={{backgroundColor: isCompleted && !isRejected ? '#27ae60' : '#d1d5db'}} />
              )}
            </div>
          );
        })}
      </div>
    );
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
        Reconciliation Queue ({filtered.length} items)
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
                <label><User size={14} /> Vendor</label>
                <input
                  type="text"
                  placeholder="Search vendor..."
                  value={filters.vendor}
                  onChange={e => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
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
              if (displayKey === 'created at') displayKey = 'Created At';
              if (displayKey === 'invoice number') displayKey = 'Invoice No.';
              if (displayKey === 'total amount') displayKey = 'Total Amount';

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
                  <div onClick={() => toggleSort('created_at')}>
                    <Clock size={14} /> Created On {sortField === 'created_at' ? (sortAsc ? '↑' : '↓') : ''}
                  </div>
                  <div className="column-filter-row">
                    <Search size={12} />
                    <input
                      type="date"
                      placeholder="Filter date..."
                      value={(columnFilters.created_at || '').split('T')[0]}
                      onChange={e => setColumnFilters(prev => ({ ...prev, created_at: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
              </th>
              <th style={{ width: '150px' }}>
                <div className="th-content">
                  <div onClick={() => toggleSort('invoice_number')}>
                    <FileText size={14} /> Invoice No. {sortField === 'invoice_number' ? (sortAsc ? '↑' : '↓') : ''}
                  </div>
                  <div className="column-filter-row">
                    <Search size={12} />
                    <input
                      type="text"
                      placeholder="Filter invoice no..."
                      value={columnFilters.invoice_number}
                      onChange={e => setColumnFilters(prev => ({ ...prev, invoice_number: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
              </th>
              <th style={{ width: '120px' }}>
                <div className="th-content">
                  <div onClick={() => toggleSort('vendor')}>
                    <User size={14} /> Vendor {sortField === 'vendor' ? (sortAsc ? '↑' : '↓') : ''}
                  </div>
                  <div className="column-filter-row">
                    <Search size={12} />
                    <input
                      type="text"
                      placeholder="Filter vendor..."
                      value={columnFilters.vendor}
                      onChange={e => setColumnFilters(prev => ({ ...prev, vendor: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
              </th>
              {/* <th style={{ width: '120px' }}>
                <div className="th-content">
                  <div onClick={() => toggleSort('total_amount')}>
                    <DollarSign size={14} /> Amount {sortField === 'total_amount' ? (sortAsc ? '↑' : '↓') : ''}
                  </div>
                  <div className="column-filter-row">
                    <Search size={12} />
                    <input
                      type="number"
                      placeholder="Filter amount..."
                      value={columnFilters.total_amount}
                      onChange={e => setColumnFilters(prev => ({ ...prev, total_amount: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
              </th> */}
              <th style={{ width: '100px' }}>
                <div className="th-content">
                  <div>Progress</div>
                </div>
              </th>
              <th style={{ width: '120px' }}>
                <div className="th-content">
                  <div onClick={() => toggleSort('status')}>
                    <span className="status-dot-label"></span> Status {sortField === 'status' ? (sortAsc ? '↑' : '↓') : ''}
                  </div>
                  <div className="column-filter-row">
                    <Search size={12} />
                    <select
                      value={columnFilters.status}
                      onChange={e => setColumnFilters(prev => ({ ...prev, status: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    >
                      <option value="">All</option>
                      {getUniqueValues('status').map(status => (
                        <option key={status} value={status}>{capitalizeStatus(status)}</option>
                      ))}
                    </select>
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
              paginatedData.map((inv, index) => (
                <tr key={inv.id}>
                  <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                  <td>{inv.id}</td>
                  <td>
                    {inv.created_at ? (
                      <>
                        {new Date(inv.created_at).toLocaleDateString('en-GB')}
                        <br />
                        {new Date(inv.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{inv.invoice_number}.pdf</td>
                  <td>{inv.vendor}</td>
                  {/* <td>₹{inv.total_amount.toLocaleString('en-IN')}</td> */}
                  <td>{getStatusDots(inv.status)}</td>
                  <td className="status-cell">
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: statusColor(inv.status) + '20',
                        color: statusColor(inv.status),
                        border: `1px solid ${statusColor(inv.status)}40`
                      }}
                    >
                      {inv.status.includes('OCR in progress') || inv.status.includes('processing') || inv.status.includes('queued')
                        ? `${inv.status.split(' ')[0]} ${Math.floor(inv.ocr_confidence || 0)}%`
                        : capitalizeStatus(inv.status)}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn" onClick={() => navigate(`/match/${inv.id}`)}>View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                  No documents found matching your criteria.
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

export default ReconQueue;