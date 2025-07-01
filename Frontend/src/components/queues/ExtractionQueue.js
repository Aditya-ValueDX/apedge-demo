import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ExtractionQueue.css'
const PAGE_SIZE = 5;

const ExtractionQueue = () => {
  const [files, setFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    invoice_date: '',
    created_at: '',
  });

  const navigate = useNavigate();

  useEffect(() => {


    const fetchOCRData = async () => {
      try {
        const [ocrRes, invRes] = await Promise.all([
          fetch('http://localhost:5000/api/ocr-results'),
          fetch('http://localhost:5000/api/invoices')
        ]);

        // Check if responses are OK before parsing JSON
        const ocrRaw = ocrRes.ok ? await ocrRes.json() : [];
        const invoices = invRes.ok ? await invRes.json() : [];

        // ✅ Only show invoices where status is "Extraction Done"
        const ready = invoices.filter(inv => inv.status === 'Extraction Done');

        const formatted = ocrRaw
          .filter(ocr => ready.find(inv => inv.id == ocr.invoiceId))
          .map((entry, idx) => {
            const inv = ready.find(i => i.id == entry.invoiceId);
            return {
              id: entry.invoiceId,
              invoice_number: entry.ocrData?.invoiceNumber || `INV-${idx + 1}`,
              vendor: { name: entry.ocrData?.vendor || 'Unknown' },
              total_amount: entry.ocrData?.amount || '-',
              po_number: entry.ocrData?.poNumber || '—',
              invoice_date: entry.ocrData?.date || '',
              file_name: entry.file_name || `${entry.ocrData?.invoiceNumber || `Invoice-${idx + 1}`}.pdf`,
              created_at: entry.timestamp || '',
              ocr_confidence: entry.ocr_confidence || 90 + (idx % 10),
              status: inv.status || 'unknown'
            };
          });

        setFiles(formatted);
      } catch (err) {
        console.error('❌ Failed to fetch OCR or Invoice data:', err);
      }
    };

    fetchOCRData();
  }, []);

  useEffect(() => {
    let result = [...files];

    if (filters.status) {
      result = result.filter(f => f.status === filters.status);
    }
    if (filters.vendor) {
      result = result.filter(f => f.vendor?.name?.toLowerCase().includes(filters.vendor.toLowerCase()));
    }
    if (filters.from_date) {
      result = result.filter(f => new Date(f.invoice_date) >= new Date(filters.from_date));
    }
    if (filters.to_date) {
      result = result.filter(f => new Date(f.invoice_date) <= new Date(filters.to_date));
    }
    if (filters.invoice_date) {
      result = result.filter(f => f.invoice_date === filters.invoice_date);
    }
    if (filters.created_at) {
      result = result.filter(f => f.created_at?.slice(0, 10) === filters.created_at);
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'invoice_date' || sortField === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
    });

    setFiltered(result);
    setPage(1);
  }, [files, filters, sortField, sortAsc]);

  const paginatedData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(prev => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      invoice_date: '',
      created_at: '',
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB');
  };

  const statusColor = (status) => {
    const map = {
      uploaded: '#6366f1',
      'Extraction Done': '#16a34a',
      reconciled: '#f59e0b',
      verified: '#10b981',
      draft_saved: '#94a3b8',
      default: '#9ca3af'
    };

    return map[status] || map.default;
  };

  const getPaginationRange = (current, total) => {
    const range = [];
    //   const delta = 2;

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
    const steps = ['uploaded', 'Extraction Done', 'extracted', 'reconciled', 'verified'];
    const currentStepIndex = steps.findIndex(step => status.toLowerCase().includes(step.toLowerCase()));

    return (
      <div className="status-tracker">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          return (
            <div key={step} className="tracker-step">
              <div className="tooltip-wrapper">
                <div className={`dot ${isCompleted ? 'filled' : ''}`} />
                <span className="tooltip-text">{step.replace(/_/g, ' ')}</span>
              </div>
              {index !== steps.length - 1 && <div className={`line ${index < currentStepIndex ? 'active' : ''}`} />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="processing-queue">
      <div className="queue-header">Invoice Queue ({filtered.length} items)</div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>From Date</label>
          <input
            type="date"
            value={filters.from_date || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input
            type="date"
            value={filters.to_date || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <label>Vendor</label>
          <input
            type="text"
            placeholder="Vendor Name"
            value={filters.vendor || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All</option>
            {[...new Set(files.map(f => f.status))].map((status, i) => (
              <option key={i} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <button className="clear-btn" onClick={clearFilters}>Clear Filters</button>
      </div>


      {/* Table */}
      <div className="table-container" style={{ overflowX: 'auto' }}>

        <table className="queue-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th onClick={() => toggleSort('id')}>ID {sortField === 'id' ? (sortAsc ? '↑' : '↓') : '↑↓'}</th>
              <th onClick={() => toggleSort('created_at')}>Created On {sortField === 'created_at' ? (sortAsc ? '↑' : '↓') : '↑↓'}</th>
              <th onClick={() => toggleSort('invoice_number')}>File Name {sortField === 'invoice_number' ? (sortAsc ? '↑' : '↓') : '↑↓'}</th>
              <th>PO No</th>
              <th onClick={() => toggleSort('invoice_date')}>Invoice Date</th>
              <th>Vendor</th>
              {/* <th onClick={() => toggleSort('total_amount')}>Total Amount</th> */}
              {/* <th onClick={() => toggleSort('invoice_date')}>Invoice Date {sortField === 'invoice_date' ? (sortAsc ? '↑' : '↓') : '↑↓'}</th> */}
              <th>Progress </th>
              <th onClick={() => toggleSort('status')}>Status {sortField === 'status' ? (sortAsc ? '↑' : '↓') : '↑↓'}</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((inv, index) => (
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
                    '-'
                  )}
                </td>
                <td>{inv.file_name}</td>
                <td>{inv.po_number}</td>
                <td>
                  {inv.invoice_date
                    ? new Date(inv.invoice_date).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                    : '-'}
                </td>
                <td>{inv.vendor?.name || 'Unknown'}</td>
                {/* <td>{inv.total_amount}</td> */}
                {/* <td>{formatDate(inv.invoice_date)}</td> */}
                <td className="status-cell">
                  {getStatusDots(inv.status)}

                </td>

                <td style={{ color: statusColor(inv.status), fontWeight: 500 }}>
                  {inv.status.includes('OCR in progress') || inv.status.includes('processing') || inv.status.includes('queued')
                    ? `${inv.status.split(' ')[0]} ${Math.floor(inv.ocr_confidence || inv.match_confidence)}%`
                    : inv.status}
                </td>
                <td>
                  <button
                    className="action-btn"
                    onClick={() => navigate(`/editor/${inv.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>

            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          &lsaquo;
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
          disabled={page === Math.ceil(filtered.length / PAGE_SIZE)}
        >
          &rsaquo;
        </button>
      </div>

    </div>
  );
};

export default ExtractionQueue;
