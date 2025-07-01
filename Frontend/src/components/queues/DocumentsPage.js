import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ViewDocumentModal from '../Upload/ViewDocumentModal.js'; // Added .js extension
import '../styles/ExtractionQueue.css';

const PAGE_SIZE = 10;

const DocumentsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [docUrl, setDocUrl] = useState('');
    const [filters, setFilters] = useState({
        type: '',
        source: '',
        from: '',
        to: '',
    });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllDocuments = async () => {
            try {
                const [invRes, grnRes, poRes] = await Promise.all([
                    fetch('http://localhost:5000/api/invoices'),
                    fetch('http://localhost:5000/api/grn/all'),
                    fetch('http://localhost:5000/api/po/all'),
                ]);

                // Check if responses are OK before parsing JSON
                const [invoices, grns, pos] = await Promise.all([
                    invRes.ok ? invRes.json() : Promise.resolve([]), // Handle non-OK responses gracefully
                    grnRes.ok ? grnRes.json() : Promise.resolve([]),
                    poRes.ok ? poRes.json() : Promise.resolve([]),
                ]);

                const formatted = [
                    ...invoices.map(doc => ({
                        id: doc.id,
                        type: 'Invoice',
                        vendor: doc.vendor || 'Unknown Vendor',
                        date: doc.date || '',
                        status: doc.status || 'uploaded',
                        amount: doc.amount || '-',
                        filePath: doc.filePath || '',
                        source: doc.source || 'Manual',   // ✅ Source dynamically from doc, fallback 'Manual'
                        docType: 'Invoice',
                        createdAt: doc.date || '',
                    })),
                    ...grns.map(doc => ({
                        id: doc.grnId,
                        type: 'GRN',
                        vendor: doc.receivedBy || 'Unknown Vendor',
                        date: doc.date || '',
                        status: 'received',
                        amount: doc.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || '-',
                        filePath: doc.filePath || '',
                        source: doc.source || 'Email',   // ✅ Example fallback
                        docType: 'GRN',
                        createdAt: doc.date || '',
                    })),
                    ...pos.map(doc => ({
                        id: doc.id,
                        type: 'PO',
                        vendor: doc.vendor || 'Unknown Vendor',
                        date: doc.date || '',
                        status: 'created',
                        amount: doc.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || '-',
                        filePath: doc.filePath || '',
                        source: doc.source || 'Email',     // ✅ Example fallback
                        docType: 'PO',
                        createdAt: doc.date || '',
                    })),
                ];

                setDocuments(formatted);
            } catch (err) {
                console.error('Failed to fetch documents:', err);
            }
        };

        fetchAllDocuments();
    }, []);

    // Apply filters
    useEffect(() => {
        let result = [...documents];
        if (filters.type) result = result.filter(doc => doc.type === filters.type);
        if (filters.source) result = result.filter(doc => doc.source === filters.source);
        if (filters.from) result = result.filter(doc => new Date(doc.date) >= new Date(filters.from));
        if (filters.to) result = result.filter(doc => new Date(doc.date) <= new Date(filters.to));
        setFiltered(result);
        setPage(1);
    }, [filters, documents]);

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
            'Extraction Done': '#16a34a',
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
            setDocUrl(`http://localhost:5000/${url}`);
            setModalOpen(true);
        } else {
            console.warn("No document available."); // Replaced alert()
        }
    };

    // ✅ Source options - can be dynamically generated from document list if needed
    const sourceOptions = ['Manual', 'Email'];

    return (
        <div className="processing-queue">
            <div className="queue-header">All Documents ({filtered.length})</div>

            {/* Filters */}
            <div className="filters">
                {/* Type Dropdown */}
                {/* Type Dropdown */}
                <div className="filter-group">
                    <label>Type</label>
                    <select
                        value={filters.type}
                        onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    >
                        <option value="">All</option>
                        <option value="Invoice">Invoice</option>
                        <option value="GRN">GRN</option>
                        <option value="PO">PO</option>
                    </select>
                </div>

                {/* Source Dropdown with Typing */}
                {/* Source Dropdown with Typing */}
                <div className="filter-group">
                    <label>Source</label>
                    <div className="input-select-wrapper">
                        <input
                            type="text"
                            list="source-options"
                            placeholder="Type or select source"
                            value={filters.source}
                            onChange={e => setFilters(prev => ({ ...prev, source: e.target.value }))}
                        />
                        <datalist id="source-options">
                            <option value="Manual" />
                            <option value="Email" />
                            <option value="Scanner" />
                            <option value="Fax" />
                            <option value="WhatsApp" />
                            <option value="Shared Drive" />
                        </datalist>
                        {/* <div className="dropdown-icon">▼</div> */}
                    </div>
                </div>

                {/* From Date */}
                <div className="filter-group">
                    <label>From</label>
                    <input
                        type="date"
                        value={filters.from}
                        onChange={e => setFilters(prev => ({ ...prev, from: e.target.value }))}
                    />
                </div>

                {/* To Date */}
                <div className="filter-group">
                    <label>To</label>
                    <input
                        type="date"
                        value={filters.to}
                        onChange={e => setFilters(prev => ({ ...prev, to: e.target.value }))}
                    />
                </div>

                <button
                    className="clear-btn"
                    onClick={() => setFilters({ type: '', source: '', from: '', to: '' })}
                >
                    Clear
                </button>
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="queue-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>ID</th>
                            <th>File Path</th>
                            <th>Source</th>
                            <th>Doc Type</th>
                            <th>Created At</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((doc, idx) => (
                            <tr key={`${doc.type}-${doc.id}`}>
                                <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                                <td>{doc.id}</td>
                                <td>{doc.filePath || '-'}</td>
                                <td>{doc.source}</td>
                                <td>{doc.docType}</td>
                                <td>
                                    {doc.createdAt ? (
                                        <>
                                            {new Date(doc.createdAt).toLocaleDateString('en-GB')}
                                            <br />
                                            {new Date(doc.createdAt).toLocaleTimeString('en-IN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </>
                                    ) : (
                                        '-'
                                    )}
                                </td>
                                <td style={{ color: statusColor(doc.status), fontWeight: 600 }}>{doc.status}</td>
                                <td>
                                    <button className="action-btn" onClick={() => openViewer(doc.filePath)}>View</button>
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
                    disabled={page === Math.ceil(filtered.length / PAGE_SIZE)}
                >
                    &rsaquo;
                </button>
            </div>

            {/* View Document Modal */}
            <ViewDocumentModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                fileUrl={docUrl}
            />
        </div>
    );
};

export default DocumentsPage;
