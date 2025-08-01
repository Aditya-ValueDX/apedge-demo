import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ViewDocumentModal from '../Upload/ViewDocumentModal';
import {
  Search, Filter, X, ChevronDown, Calendar, FileText,
  User, Hash, Clock, ListFilter, DollarSign
} from 'lucide-react';
import '../styles/ExtractionQueue.css';
import { BASE_URL } from '../../config'; // Import BASE_URL

const PAGE_SIZE = 10;

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Column filters
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    filePath: '',
    source: '',
    docType: '',
    createdAt: '',
    status: '',
    vendor: '',
    amount: '',
  });

  // Advanced filters
  const [filters, setFilters] = useState({
    type: '',
    source: '',
    from_date: '',
    to_date: '',
    status: '',
    vendor: '',
    amount_min: '',
    amount_max: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllDocuments = async () => {
      try {
        const [invRes, grnRes, poRes, ocrRes] = await Promise.all([
          fetch(`${BASE_URL}/api/invoices`), // Use BASE_URL
          fetch(`${BASE_URL}/api/grn/all`), // Use BASE_URL
          fetch(`${BASE_URL}/api/po/all`), // Use BASE_URL
          fetch(`${BASE_URL}/api/ocr-results`) // Use BASE_URL
        ]);

        const [invoices, grns, pos, ocrResults] = await Promise.all([
          invRes.json(), grnRes.json(), poRes.json(), ocrRes.json()
        ]);

        const formatted = [
          ...invoices.map(doc => {
            const ocrData = ocrResults.find(o => o.invoiceId === doc.id)?.ocrData || {};
            const totalAmount = parseFloat(ocrData.grandTotal || ocrData.Grand_Total || ocrData.amount || ocrData.Amount || 0);
            const vendorName = doc.vendor || ocrData.vendor || ocrData.Name || ocrData.businessName || 'Unknown Vendor';
            const createdAt = doc.date || ocrData.timestamp || new Date().toISOString();

            return {
              id: doc.id,
              type: 'Invoice',
              vendor: vendorName,
              date: doc.date || ocrData.date,
              status: doc.status || 'uploaded',
              amount: totalAmount,
              filePath: doc.filePath || '',
              source: doc.source || 'Manual',
              docType: 'Invoice',
              createdAt: createdAt,
            };
          }),
          ...grns.map(doc => ({
            id: doc.grnId,
            type: 'GRN',
            vendor: doc.receivedBy || 'Unknown Vendor',
            date: doc.date || '',
            status: 'received',
            amount: parseFloat(doc.items?.reduce((sum, item) => sum + (item.amount || 0), 0)) || 0,
            filePath: doc.filePath || '',
            source: doc.source || 'Email',
            docType: 'GRN',
            createdAt: doc.createdAt || doc.date || new Date().toISOString(),
          })),
          ...pos.map(doc => ({
            id: doc.id,
            type: 'PO',
            vendor: doc.vendor || 'Unknown Vendor',
            date: doc.date || '',
            status: 'created',
            amount: parseFloat(doc.items?.reduce((sum, item) => sum + (item.amount || 0), 0)) || 0,
            filePath: doc.filePath || '',
            source: doc.source || 'Email',
            docType: 'PO',
            createdAt: doc.createdAt || doc.date || new Date().toISOString(),
          })),
        ];

        setDocuments(formatted);
      } catch (err) {
        console.error('Failed to fetch documents:', err);
      }
    };

    fetchAllDocuments();
  }, []);

  // Apply all filters and sorting
  const filteredAndSortedDocuments = useMemo(() => {
    let result = [...documents];

    // Apply column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      // Only apply filter if value is not empty
      if (value) {
        result = result.filter(doc => {
          const docValue = doc[key]?.toString().toLowerCase() || '';
          if (key === 'createdAt' || key === 'date') {
            // For date fields, compare only the date part
            return docValue.includes(value.toLowerCase().split('T')[0]);
          }
          if (key === 'amount') {
            const amount = parseFloat(doc.amount);
            const filterVal = parseFloat(value);
            return !isNaN(amount) && !isNaN(filterVal) && amount.toString().includes(filterVal.toString());
          }
          return docValue.includes(value.toLowerCase());
        });
      }
    });

    // Apply advanced filters
    if (filters.type) result = result.filter(doc => doc.type === filters.type);
    if (filters.source) result = result.filter(doc => doc.source === filters.source);
    if (filters.status) result = result.filter(doc => doc.status === filters.status);
    if (filters.vendor) result = result.filter(doc => doc.vendor?.toLowerCase().includes(filters.vendor.toLowerCase()));
    if (filters.from_date) result = result.filter(doc => new Date(doc.date) >= new Date(filters.from_date));
    if (filters.to_date) result = result.filter(doc => new Date(doc.date) <= new Date(filters.to_date));
    if (filters.amount_min) result = result.filter(doc => doc.amount >= parseFloat(filters.amount_min));
    if (filters.amount_max) result = result.filter(doc => doc.amount <= parseFloat(filters.amount_max));

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'date' || sortField === 'createdAt') {
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
  }, [documents, columnFilters, filters, sortField, sortAsc]);

  useEffect(() => {
    setFiltered(filteredAndSortedDocuments);
    setPage(1);
  }, [filteredAndSortedDocuments]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const statusColor = (status) => {
    const map = {
      uploaded: '#6366f1',
      'ocr_done': '#16a34a',
      reconciled: '#f59e0b',
      verified: '#10b981',
      received: '#3b82f6',
      created: '#8b5cf6',
      default: '#9ca3af',
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

  const clearAllFilters = () => {
    setFilters({ type: '', source: '', from_date: '', to_date: '', status: '', vendor: '', amount_min: '', amount_max: '' });
    setColumnFilters({ id: '', filePath: '', source: '', docType: '', createdAt: '', status: '', vendor: '', amount: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || Object.values(columnFilters).some(v => v);

  const getUniqueValues = (field) => {
    return [...new Set(documents.map(doc => doc[field]).filter(val => val !== null && val !== undefined && val !== ''))];
  };

  const capitalizeStatus = (status) => {
    if (!status) return '';
    return String(status)
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(prev => !prev);
    } else {
      setSortField(field);
      setSortAsc(true); // Default to ascending when changing sort field
    }
  };

  return (
    <div className="processing-queue">
      <div className="queue-header">
        All Documents ({filtered.length} items)
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
                <label><FileText size={14} /> Document Type</label>
                <select
                  value={filters.type}
                  onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">All Types</option>
                  {getUniqueValues('type').map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label><User size={14} /> Source</label>
                <select
                  value={filters.source}
                  onChange={e => setFilters(prev => ({ ...prev, source: e.target.value }))}
                >
                  <option value="">All Sources</option>
                  {getUniqueValues('source').map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
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
                <label><User size={14} /> Vendor</label>
                <input
                  type="text"
                  placeholder="Search vendor..."
                  value={filters.vendor}
                  onChange={e => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
                />
              </div>

              <div className="filter-group">
                <label><Calendar size={14} /> Date From</label>
                <input
                  type="date"
                  value={filters.from_date}
                  onChange={e => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
                />
              </div>

              <div className="filter-group">
                <label><Calendar size={14} /> Date To</label>
                <input
                  type="date"
                  value={filters.to_date}
                  onChange={e => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
                />
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
              if (displayKey === 'docType') displayKey = 'Doc Type';
              if (displayKey === 'createdAt') displayKey = 'Created At';

              let displayValue = value;
              if (key === 'status' || key === 'docType') displayValue = capitalizeStatus(value);

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
                  <div onClick={() => toggleSort('filePath')}>
                    <FileText size={14} /> File Path {sortField === 'filePath' ? (sortAsc ? '↑' : '↓') : ''}
                  </div>
                  <div className="column-filter-row">
                    <Search size={12} />
                    <input
                      type="text"
                      placeholder="Filter path..."
                      value={columnFilters.filePath}
                      onChange={e => setColumnFilters(prev => ({ ...prev, filePath: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
              </th>
              <th style={{ width: '120px' }}>
                <div className="th-content">
                  <div onClick={() => toggleSort('source')}>
                    <User size={14} /> Source {sortField === 'source' ? (sortAsc ? '↑' : '↓') : ''}
                  </div>
                  <div className="column-filter-row">
                    <Search size={12} />
                    <select
                      value={columnFilters.source}
                      onChange={e => setColumnFilters(prev => ({ ...prev, source: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    >
                      <option value="">All</option>
                      {getUniqueValues('source').map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </th>
              <th style={{ width: '150px' }}>
                <div className="th-content">
                  <div onClick={() => toggleSort('docType')}>
                    <FileText size={14} /> Doc Type {sortField === 'docType' ? (sortAsc ? '↑' : '↓') : ''}
                  </div>
                  <div className="column-filter-row">
                    <Search size={12} />
                    <select
                      value={columnFilters.docType}
                      onChange={e => setColumnFilters(prev => ({ ...prev, docType: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    >
                      <option value="">All</option>
                      {getUniqueValues('type').map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </th>
              
              <th style={{ width: '150px' }}>
                <div className="th-content">
                  <div onClick={() => toggleSort('createdAt')}>
                    <Clock size={14} /> Created At {sortField === 'createdAt' ? (sortAsc ? '↑' : '↓') : ''}
                  </div>
                  <div className="column-filter-row">
                    <Search size={12} />
                    <input
                      type="date"
                      placeholder="Filter date..."
                      value={(columnFilters.createdAt || '').split('T')[0]}
                      onChange={e => setColumnFilters(prev => ({ ...prev, createdAt: e.target.value }))}
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
                  <div>Action</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map((doc, idx) => (
                <tr key={`${doc.type}-${doc.id}`}>
                  <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td>{doc.id}</td>
                  <td>{`${doc.id}.pdf`}</td>
                  <td>{doc.source}</td>
                  <td>{doc.docType}</td>
                  {/* <td>{doc.amount ? `₹${doc.amount.toLocaleString('en-IN')}` : '—'}</td> */}
                  <td>
                    {doc.createdAt
                      ? new Date(doc.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                      : '—'}
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: statusColor(doc.status) + '20',
                        color: statusColor(doc.status),
                        border: `1px solid ${statusColor(doc.status)}40`
                      }}
                    >
                      {capitalizeStatus(doc.status)}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn" onClick={() => openViewer(doc.filePath)}>View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-500)' }}>
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
          &lsaquo;
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
          &rsaquo;
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

export default DocumentsPage;
