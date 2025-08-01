// src/components/Completed/CompletedQueue.js

import React, { useEffect, useState, useMemo } from 'react';
import ViewDocumentModal from '../Upload/ViewDocumentModal';
import {
  Search, Filter, X, ChevronDown, Calendar, FileText,
  User, Hash, DollarSign, Clock, ListFilter
} from 'lucide-react';
import '../styles/ExtractionQueue.css'; // Apply shared queue styles
import { BASE_URL } from '../../config'; // Import BASE_URL

const PAGE_SIZE = 10;

const CompletedQueue = () => {
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  const [columnFilters, setColumnFilters] = useState({
    id: '',
    vendor: '',
    date: '',
    status: '',
    total: '',
  });

  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    vendor: '',
    status: '',
    amount_min: '',
    amount_max: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, ocrRes] = await Promise.all([
          fetch(`${BASE_URL}/api/invoices`), // Use BASE_URL
          fetch(`${BASE_URL}/api/ocr-results`) // Use BASE_URL
        ]);
        const allInvoices = await invRes.json();
        const allOcrResults = await ocrRes.json();

        // Filter for statuses that represent a completed invoice.
        const completedInvoices = allInvoices.filter(inv =>
          ['reconciled', 'verified', 'matched', 'Approved'].includes(inv.status)
        );

        // Merge invoice data with OCR data to get all necessary fields.
        const populatedData = completedInvoices.map(inv => {
          const ocrData = allOcrResults.find(o => o.invoiceId === inv.id)?.ocrData || {};

          // Robustly get vendor and total amount from inconsistent data structures.
          const vendorName = inv.vendor || ocrData.vendor || ocrData.Name || ocrData.businessName || 'N/A';
          const totalAmount = parseFloat(inv.totalAmount || ocrData.grandTotal || ocrData.Grand_Total || ocrData.amount || ocrData.Amount || 0);

          return {
            ...inv,
            vendor: vendorName,
            total: totalAmount,
            date: inv.date || ocrData.date || ocrData.invoiceDate,
            filePath: inv.filePath || '',
          };
        });

        setInvoices(populatedData);
      } catch (error) {
        console.error("Failed to fetch or process invoice data:", error);
      }
    };
    fetchData();
  }, []);

  const filteredAndSortedInvoices = useMemo(() => {
    let result = [...invoices];

    Object.entries(columnFilters).forEach(([key, value]) => {
      // Only apply filter if value is not empty
      if (value) {
        result = result.filter(inv => {
          const invValue = inv[key]?.toString().toLowerCase() || '';
          if (key === 'date') {
            return invValue.includes(value.toLowerCase().split('T')[0]);
          }
          if (key === 'total') {
            const amount = parseFloat(inv.total);
            const filterVal = parseFloat(value);
            return !isNaN(amount) && !isNaN(filterVal) && amount.toString().includes(filterVal.toString());
          }
          return invValue.includes(value.toLowerCase());
        });
      }
    });

    if (filters.status) {
      result = result.filter(inv => inv.status === filters.status);
    }
    if (filters.vendor) {
      result = result.filter(inv => inv.vendor?.toLowerCase().includes(filters.vendor.toLowerCase()));
    }
    if (filters.from_date) {
      result = result.filter(inv => new Date(inv.date) >= new Date(filters.from_date));
    }
    if (filters.to_date) {
      result = result.filter(inv => new Date(inv.date) <= new Date(filters.to_date));
    }
    if (filters.amount_min) {
      result = result.filter(inv => inv.total >= parseFloat(filters.amount_min));
    }
    if (filters.amount_max) {
      result = result.filter(inv => inv.total <= parseFloat(filters.amount_max));
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sortField === 'total') {
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
  }, [invoices, columnFilters, filters, sortField, sortAsc]);

  useEffect(() => {
    setFiltered(filteredAndSortedInvoices);
    setPage(1);
  }, [filteredAndSortedInvoices]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(prev => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const statusColor = (status) => {
    const map = {
      uploaded: '#6366f1',
      reconciled: '#10b981',
      verified: '#10b981',
      matched: '#10b981',
      default: '#9ca3af',
      Approved: '#27ae60'
    };
    return map[status] || map.default;
  };

  const openViewer = (url) => {
    if (url) {
      setDocUrl(`${BASE_URL}/${url}`); // Use BASE_URL
      setModalOpen(true);
    } else {
      console.warn("No document available for this entry.");
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

  const clearAllFilters = () => {
    setFilters({ from_date: '', to_date: '', vendor: '', status: '', amount_min: '', amount_max: '' });
    setColumnFilters({ id: '', vendor: '', date: '', status: '', total: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || Object.values(columnFilters).some(v => v);

  const getUniqueValues = (field) => {
    return [...new Set(invoices.map(inv => inv[field]).filter(val => val !== null && val !== undefined && val !== ''))];
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
        Approved Invoices ({filtered.length} items)
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
              if (displayKey === 'total') displayKey = 'Amount';

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

      {invoices.length === 0 && !hasActiveFilters ? (
        <p style={{ marginTop: '20px', fontSize: '15px', textAlign: 'center', color: 'var(--gray-600)' }}>
          No completed invoices found.
        </p>
      ) : (
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
                      <Hash size={14} /> Invoice ID {sortField === 'id' ? (sortAsc ? '↑' : '↓') : ''}
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
                <th style={{ width: '120px' }}>
                  <div className="th-content">
                    <div onClick={() => toggleSort('total')}>
                      <DollarSign size={14} /> Amount {sortField === 'total' ? (sortAsc ? '↑' : '↓') : ''}
                    </div>
                    <div className="column-filter-row">
                      <Search size={12} />
                      <input
                        type="number"
                        placeholder="Filter amount..."
                        value={columnFilters.total}
                        onChange={e => setColumnFilters(prev => ({ ...prev, total: e.target.value }))}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </th>
                <th style={{ width: '150px' }}>
                  <div className="th-content">
                    <div onClick={() => toggleSort('date')}>
                      <Calendar size={14} /> Date {sortField === 'date' ? (sortAsc ? '↑' : '↓') : ''}
                    </div>
                    <div className="column-filter-row">
                      <Search size={12} />
                      <input
                        type="date"
                        placeholder="Filter date..."
                        value={(columnFilters.date || '').split('T')[0]}
                        onChange={e => setColumnFilters(prev => ({ ...prev, date: e.target.value }))}
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
                    <div>Document</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((inv, idx) => (
                  <tr key={inv.id}>
                    <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td>{inv.id}</td>
                    <td>{inv.vendor || '—'}</td>
                    <td>{inv.total ? `₹${inv.total.toLocaleString('en-IN')}` : '—'}</td>
                    <td>{inv.date ? new Date(inv.date).toLocaleDateString('en-GB') : '—'}</td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: statusColor(inv.status) + '20', color: statusColor(inv.status), border: `1px solid ${statusColor(inv.status)}40` }}>
                         {capitalizeStatus(inv.status)}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => openViewer(inv.filePath)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-500)' }}>
                    No completed invoices found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          ‹
        </button>
        {getPaginationRange(page, Math.ceil(filtered.length / PAGE_SIZE)).map((pg, i) => (
          <button
            key={i}
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

      <ViewDocumentModal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        fileUrl={docUrl}
      />
    </div>
  );
};

export default CompletedQueue;
