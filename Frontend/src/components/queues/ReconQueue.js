import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ExtractionQueue.css'

const PAGE_SIZE = 5;

const ReconQueue = () => {
  const [files, setFiles] = useState([]);
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
    const fetchReconData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/reconciliation');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();

        // ✅ Only show if status is not 'verified'
        const filteredData = data.filter(entry => entry.result?.status !== 'verified');

        const formatted = filteredData.map((entry, idx) => ({
          id: entry.invoiceId,
          invoice_number: entry.invoiceNumber || `INV-${idx + 1}`,
          vendor: entry.vendor || 'Unknown',
          total_amount: entry.amount || '-',
          invoice_date: entry.date || '',
          created_at: entry.timestamp || '',
          match_confidence: 85 + (idx % 15),
          status: entry.result?.status || 'extracted'
        }));

        setFiles(formatted);
      } catch (error) {
        console.error('Failed to fetch reconciliation data:', error);
      }
    };

    fetchReconData();
  }, []);

  useEffect(() => {
    let result = [...files];

    if (filters.status) {
      result = result.filter(f => f.status === filters.status);
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
    setFilters({ status: '', invoice_date: '', created_at: '' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB');
  };

  const statusColor = (status) => {
    switch (status) {
      case 'queued for matching': return '#f39c12';
      case 'verified': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#95a5a6';
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
    const steps = ['uploaded', 'Extraction Done', 'extracted', 'reconciled', 'verified'];
    const currentStepIndex = steps.indexOf(status);

    return (
      <div className="status-tracker">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          return (
            <div key={step} className="tracker-step">
              <div className="tooltip-wrapper">
                <div className={`dot ${isCompleted ? 'filled' : ''}`} />
                <span className="tooltip-text">
                  {step.replace(/_/g, ' ')}{index === currentStepIndex ? ' (current)' : ''}
                </span>
              </div>
              {index !== steps.length - 1 && (
                <div className={`line ${index < currentStepIndex ? 'active' : ''}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const capitalizeStatus = (status) => {
    if (!status) return '';
    return status
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };


  return (
    <div className="processing-queue">
      <div className="queue-header">Reconciliation Queue ({filtered.length} items)</div>

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

      <div className="table-container">

        <table className="queue-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th onClick={() => toggleSort('id')}>ID {sortField === 'id' ? (sortAsc ? '↑' : '↓') : '↑↓'}</th>
              <th onClick={() => toggleSort('created_at')}>Created On {sortField === 'created_at' ? (sortAsc ? '↑' : '↓') : '↑↓'}</th>
              <th onClick={() => toggleSort('invoice_number')}>Invoice No. {sortField === 'invoice_number' ? (sortAsc ? '↑' : '↓') : '↑↓'}</th>
              <th>Vendor</th>
              {/* <th onClick={() => toggleSort('total_amount')}>Total</th> */}
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
                <td>{inv.invoice_number}.pdf</td>
                <td>{inv.vendor?.name || 'Unknown'}</td>
                {/* <td>{inv.total_amount}</td> */}
                {/* <td>{formatDate(inv.invoice_date)}</td> */}
                <td>{getStatusDots(inv.status)}</td>

                <td className="status-cell">
                  <div className="status-label" style={{ color: statusColor(inv.status), fontWeight: 600 }}>
                    {capitalizeStatus(inv.status)}
                  </div>
                </td>


                <td>
                  <button className="action-btn" onClick={() => navigate(`/match/${inv.id}`)}>View</button>
                </td>
              </tr>

            ))}
          </tbody>
        </table>

      </div>

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&lsaquo;</button>
        {getPaginationRange(page, Math.ceil(filtered.length / PAGE_SIZE)).map((pg, idx) => (
          <button key={idx} disabled={pg === '...'} className={`page-btn ${pg === page ? 'active' : ''}`} onClick={() => typeof pg === 'number' && setPage(pg)}>{pg}</button>
        ))}
        <button onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / PAGE_SIZE), p + 1))} disabled={page === Math.ceil(filtered.length / PAGE_SIZE)}>&rsaquo;</button>
      </div>

    </div>
  );
};

export default ReconQueue;
