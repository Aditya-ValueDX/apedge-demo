import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ViewDocumentModal from './Upload/ViewDocumentModal';
import '../components/styles/matchinvoice.css';
import { FaFileInvoice, FaTruckLoading, FaBoxOpen, FaColumns, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const MatchInvoice = () => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('comparison');
    const [isModalOpen, setModalOpen] = useState(false);
    const [docUrl, setDocUrl] = useState('');
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editedInvoice, setEditedInvoice] = useState({});
    const [editedPO, setEditedPO] = useState({});
    const [editedGRN, setEditedGRN] = useState({});
    const [selectedFields, setSelectedFields] = useState([]);

    const [rejections, setRejections] = useState({});
    const [rejectionComments, setRejectionComments] = useState({});

    const HIDDEN_FIELDS = ['id', 'filePath', 'fileName', 'companyId', 'clerkId', 'poId', 'grnId', 'logs', 'status',
        'receivedBy', 'inspectedBy', 'date', 'remarks', 'shippingAddress', 'billingAddress'];

    const allKeysSet = new Set();
    [editedInvoice, editedPO, editedGRN].forEach(obj => {
        if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
                if (!HIDDEN_FIELDS.includes(key)) {
                    allKeysSet.add(key);
                }
            });
        }
    });
    const dynamicFields = Array.from(allKeysSet);

    const categorizeField = (field) => {
        const headerFields = [
            'vendor', 'gstin', 'consignee', 'buyerOrderNo', 'deliveryNote',
            'deliveryNoteDate', 'dispatchDocNo', 'billOfLading',
            'termsOfDelivery', 'placeOfSupply', 'invoiceNumber', 'ewayBillNo', 'invoiceDate'
        ];
        // Footer section fields include totals, tax breakdown, bank info, and declarations
        const footerFields = [
            'totalAmount', 'amountInWords', 'taxBreakup', 'taxAmountInWords', 'remarks',
            'declaration', 'bankDetails', 'signature'
        ];

        if (headerFields.includes(field)) return 'Invoice Header';
        if (field === 'items') return 'Itemized Details';
        if (footerFields.includes(field)) return 'Invoice Footer';
        return 'Other Fields';
    };


    const groupedFields = dynamicFields.reduce((acc, field) => {
        const section = categorizeField(field);
        if (!acc[section]) acc[section] = [];
        acc[section].push(field);
        return acc;
    }, {});

    const docs = [
        { title: 'Vendor Invoice', data: editedInvoice, type: 'invoice' },
        { title: 'Purchase Order', data: editedPO, type: 'po' },
        { title: 'Goods Receipt Note', data: editedGRN, type: 'grn' }
    ];

    const handleRejectionComment = (key, value) => {
        setRejectionComments(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                console.log(`📦 Fetching invoice: /api/invoice/${invoiceId}`);
                const invoiceRes = await fetch(`http://localhost:5000/api/invoice/${invoiceId}`);
                const poRes = await fetch('http://localhost:5000/api/po/all');
                const grnRes = await fetch('http://localhost:5000/api/grn/all');

                console.log('✅ invoiceRes:', invoiceRes.status);
                console.log('✅ poRes:', poRes.status);
                console.log('✅ grnRes:', grnRes.status);

                if (!invoiceRes.ok || !poRes.ok || !grnRes.ok) {
                    console.error("❌ One or more fetches failed", {
                        invoiceStatus: invoiceRes.status,
                        poStatus: poRes.status,
                        grnStatus: grnRes.status,
                    });
                    setLoading(false);
                    return;
                }

                const invoiceData = await invoiceRes.json();
                const poData = await poRes.json();
                const grnData = await grnRes.json();

                console.log('📄 Invoice data:', invoiceData);
                console.log('📋 PO list:', poData);
                console.log('🚚 GRN list:', grnData);

                const matchedPO = poData.find(po => po.id === invoiceData.poId);
                const matchedGRN = grnData.find(grn => grn.poId === invoiceData.poId);

                console.log('🔗 Matched PO:', matchedPO);
                console.log('🔗 Matched GRN:', matchedGRN);

                console.log("Invoice PO Ref:", invoiceData.purchaseOrderRef);
                console.log("All PO IDs:", poData.map(po => po.id));

                setInvoice(invoiceData);
                setEditedInvoice(invoiceData);
                setEditedPO(matchedPO || {});
                setEditedGRN(matchedGRN || {});
            } catch (err) {
                console.error("❌ Error during fetchAllData:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [invoiceId]);

    const matchItemsByName = (invItems, poItems, grnItems) => {
        return invItems.map((invItem, i) => {
            const poMatch = poItems.find((p, idx) => p.name === invItem.name);
            const grnMatch = grnItems.find((g, idx) => g.name === invItem.name);

            return {
                invoice: invItem,
                po: poMatch || {},
                grn: grnMatch || {},
                index: i,
                poRow: poItems.findIndex(p => p.name === invItem.name),
                grnRow: grnItems.findIndex(g => g.name === invItem.name)
            };
        });
    };

    const openViewer = (relativePath) => {
        const fullUrl = `http://localhost:5000/${relativePath?.replace(/^\/+/, '')}`;
        setDocUrl(fullUrl);
        setModalOpen(true);
    };


    const handleEdit = (type, key, value) => {
        const updater = {
            invoice: setEditedInvoice,
            po: setEditedPO,
            grn: setEditedGRN
        }[type];
        updater(prev => ({ ...prev, [key]: value }));
    };

    const renderSection = (title, data, onChange, type) => {
        if (!data) return null;
        return (
            <div className="card">
                <div className="card-header">
                    <h4>{title}</h4>
                    <button className="view-doc" onClick={() => openViewer(data.filePath)}>View Document</button>
                </div>
            </div>
        );
    };

    const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');

    const user = {
        id: storedUser.id || 'U001',
        name: storedUser.companyName || 'Unknown User',
        role: storedUser.role || 'User',
        email: storedUser.email || 'unknown@example.com',
        avatar: storedUser.avatar || null
    };

    const handleMatchApprove = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/match/${invoiceId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id || 'system',
                    status: 'Approved',
                    verified: true,
                    amount: editedInvoice.total || 25000,
                    date: editedInvoice.date,
                    vendor: editedInvoice.vendor,
                    overriddenFields: selectedFields,
                    rejectionComments,
                    invoice: editedInvoice,
                    po: editedPO,
                    grn: editedGRN
                }),
            });

            const result = await response.json();
            if (result.success) {
                alert("✅ Invoice Approved!");
                navigate('/match'); // or navigate('/completed') if redirected
            }
        } catch (error) {
            console.error('❌ Approval failed:', error);
        }
    };

    if (loading) return <p className="loading">Loading invoice...</p>;

    const orderedSections = ['Invoice Header', 'Itemized Details', 'Amount Details', 'Invoice Footer', 'Other Fields'];

    const matchCount = {};
    const mismatchCount = {};

    orderedSections.forEach(section => {
        matchCount[section] = 0;
        mismatchCount[section] = 0;

        const fields = groupedFields[section] || [];

        fields.forEach(field => {
            if (field === 'items') {
                matchItemsByName(
                    editedInvoice.items || [],
                    editedPO.items || [],
                    editedGRN.items || []
                ).forEach(({ invoice: invItem, po, grn }) => {
                    const mismatch = (grn.quantity || 0) - (invItem.quantity || 0) !== 0 ||
                        invItem.rate !== po.rate ||
                        invItem.hsnsac !== po.hsnsac;

                    mismatch ? mismatchCount[section]++ : matchCount[section]++;
                });
            } else {
                const inv = editedInvoice[field];
                const po = editedPO[field];
                const grn = editedGRN[field];
                const isMatch = JSON.stringify(inv) === JSON.stringify(po) &&
                    JSON.stringify(po) === JSON.stringify(grn);

                isMatch ? matchCount[section]++ : mismatchCount[section]++;
            }
        });
    });

    const calculateMatchStats = (fields, section) => {
        let match = 0;
        let mismatch = 0;

        fields.forEach(field => {
            if (field === 'items') {
                const matchedRows = matchItemsByName(
                    editedInvoice.items || [],
                    editedPO.items || [],
                    editedGRN.items || []
                );

                matchedRows.forEach(({ invoice: invItem, po, grn }) => {
                    const labels = ['Item Name', 'Description', 'HSN/SAC', 'Quantity', 'Rate', 'Unit', 'Amount'];

                    labels.forEach(label => {
                        const getValue = (obj) => {
                            switch (label) {
                                case 'Item Name': return obj.name;
                                case 'Description': return obj.desc;
                                case 'HSN/SAC': return obj.hsnsac;
                                case 'Quantity': return obj.quantity;
                                case 'Rate': return obj.rate;
                                case 'Unit': return obj.per;
                                case 'Amount': return (obj.quantity || 0) * (obj.rate || 0);
                                default: return '';
                            }
                        };

                        const invVal = getValue(invItem);
                        const poVal = getValue(po);
                        const grnVal = getValue(grn);

                        const isMatch = invVal === poVal && invVal === grnVal;
                        isMatch ? match++ : mismatch++;
                    });
                });
            } else {
                const inv = editedInvoice[field];
                const po = editedPO[field];
                const grn = editedGRN[field];
                const isMatch = inv === po && inv === grn;
                isMatch ? match++ : mismatch++;
            }
        });

        return { match, mismatch };
    };


    return (
        <div className="match-page">
            <h2 style={{ textAlign: 'center' }}>3-Way Invoice Match</h2>

            {/* <div className="tabs fade-in">
                <button className={activeTab === 'comparison' ? 'active' : ''} onClick={() => setActiveTab('comparison')}><FaColumns />Comparison View</button>
                <button className={activeTab === 'invoice-po' ? 'active' : ''} onClick={() => setActiveTab('invoice-po')}><FaFileInvoice />Invoice</button>
                <button className={activeTab === 'invoice-grn' ? 'active' : ''} onClick={() => setActiveTab('invoice-grn')}><FaTruckLoading />Goods Received Note</button>
                <button className={activeTab === 'po-grn' ? 'active' : ''} onClick={() => setActiveTab('po-grn')}><FaBoxOpen />Purchase Order</button>
            </div> */}

            <div className="match-grid">
                {activeTab === 'comparison' && (
                    <>

                        {docs.map(doc => renderSection(doc.title, doc.data, handleEdit, doc.type))}

                    </>
                )}
                {activeTab === 'invoice-po' && renderSection('Vendor Invoice', editedInvoice, handleEdit, 'invoice')}
                {activeTab === 'invoice-grn' && renderSection('Goods Receipt Note', editedGRN, handleEdit, 'grn')}
                {activeTab === 'po-grn' && renderSection('Purchase Order', editedPO, handleEdit, 'po')}
            </div>

            {/* <hr className="divider" /> */}

            <div className="comparison-table-container">
                <div className="comparison-table-scroll">
                    {orderedSections.map((section, sIdx) => {
                        const fields = groupedFields[section];
                        if (!fields || fields.length === 0) return null;

                        const { match: sectionMatchCount, mismatch: sectionMismatchCount } = calculateMatchStats(fields, section);

                        return (
                            <div className="section-wrapper" key={`section-${sIdx}`}>
                                <h3 className="section-title">
                                    {section}
                                    <span className="match-count">
                                        <FaCheckCircle className="icon match-icon" /> Match: {sectionMatchCount} &nbsp; | &nbsp;
                                        <FaTimesCircle className="icon mismatch-icon" /> Mismatch: {sectionMismatchCount}
                                    </span>

                                </h3>

                                <table className="compare-table">
                                    <thead>
                                        <tr>
                                            <th>Sr No</th>
                                            {/* {section === 'Itemized Details' && <th>Item Name</th>} */}
                                            <th>Field</th>
                                            <th>Invoice</th>
                                            <th>PO</th>
                                            <th>GRN</th>
                                            <th>Match Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {fields.map((field, fIdx) => {
                                            const inv = editedInvoice[field];
                                            const po = editedPO[field];
                                            const grn = editedGRN[field];
                                            const match = JSON.stringify(inv) === JSON.stringify(po) && JSON.stringify(po) === JSON.stringify(grn);

                                            if (field === 'items') {
                                                return matchItemsByName(inv || [], po || [], grn || []).map((row, idx) => {
                                                    const { invoice: item, po, grn, poRow, grnRow } = row;
                                                    const key = `items-${idx}`;
                                                    const fieldsToShow = ['Item Name', 'Description', 'HSN/SAC', 'Quantity', 'Rate', 'Unit', 'Amount'];

                                                    const mismatchField = (label) => {
                                                        switch (label) {
                                                            case 'Item Name':
                                                                return item.name !== po.name || item.name !== grn.name;
                                                            case 'Description':
                                                                return item.name !== po.name || item.name !== grn.name;
                                                            case 'HSN/SAC':
                                                                return item.hsnsac !== po.hsnsac;
                                                            case 'Quantity':
                                                                return item.quantity !== grn.quantity;
                                                            case 'Rate':
                                                                return item.rate !== po.rate;
                                                            case 'Unit':
                                                                return item.per !== po.per;
                                                            case 'Amount':
                                                                return (item.quantity * item.rate) !== (po.quantity * po.rate);
                                                            default:
                                                                return false;
                                                        }
                                                    };

                                                    const rows = [];

                                                    // First: Add the Matched At Row as the header row for this item
                                                    rows.push(
                                                        <tr key={`${key}-matchrow`} className="row-match metadata-row">
                                                            <td rowSpan={fieldsToShow.length + 1}>{idx + 1}</td>
                                                            <td><strong>Matched At Row</strong></td>
                                                            <td>{idx + 1}</td>
                                                            <td>{poRow + 1}</td>
                                                            <td>{grnRow + 1}</td>
                                                            <td colSpan={2}></td>
                                                        </tr>
                                                    );

                                                    // Then: Add rows for each field
                                                    fieldsToShow.forEach((label, i) => {
                                                        const fieldKey = `${key}-${label}`;

                                                        const getValue = (obj) => {
                                                            switch (label) {
                                                                case 'Item Name': return obj.name;
                                                                case 'Description': return obj.desc;
                                                                case 'HSN/SAC': return obj.hsnsac;
                                                                case 'Quantity': return obj.quantity;
                                                                case 'Rate': return obj.rate;
                                                                case 'Unit': return obj.per;
                                                                case 'Amount': return (obj.quantity || 0) * (obj.rate || 0);
                                                                default: return '';
                                                            }
                                                        };

                                                        const invVal = getValue(item);
                                                        const poVal = getValue(po);
                                                        const grnVal = getValue(grn);
                                                        const isMismatch = invVal !== poVal || invVal !== grnVal || poVal !== grnVal;

                                                        rows.push(
                                                            <tr
                                                                key={fieldKey}
                                                                className={isMismatch ? 'row-mismatch' : 'row-match'}
                                                            >
                                                                <td><strong>{label}</strong></td>
                                                                <td>{invVal}</td>
                                                                <td>{poVal}</td>
                                                                <td>{grnVal}</td>
                                                                <td className={`match-col ${isMismatch ? 'match-no' : 'match-yes'}`}>
                                                                    {isMismatch ? <><FaTimesCircle /> Mismatch</> : <><FaCheckCircle /> Match</>}
                                                                </td>
                                                                <td className="action-cell">
                                                                    {isMismatch ? (
                                                                        rejections[fieldKey] !== undefined ? (
                                                                            <>
                                                                                <div className="action-buttons-inline">
                                                                                    <button className="approve" onClick={() => {
                                                                                        const updated = { ...rejections };
                                                                                        delete updated[fieldKey];
                                                                                        setRejections(updated);
                                                                                    }}>Accept</button>
                                                                                </div>
                                                                                <textarea
                                                                                    className="reason-box"
                                                                                    placeholder="Reason"
                                                                                    value={rejectionComments[fieldKey] || ''}
                                                                                    onChange={(e) => handleRejectionComment(fieldKey, e.target.value)}
                                                                                />
                                                                            </>
                                                                        ) : (
                                                                            <div className="action-buttons-inline">
                                                                                <button className="approve" onClick={() => {
                                                                                    const updated = { ...rejections };
                                                                                    delete updated[fieldKey];
                                                                                    setRejections(updated);
                                                                                }}>Accept</button>
                                                                                <button className="reject" onClick={() =>
                                                                                    setRejections((prev) => ({ ...prev, [fieldKey]: '' }))
                                                                                }>Reject</button>
                                                                            </div>
                                                                        )
                                                                    ) : (
                                                                        <span className="accepted">✔ Accepted</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    });

                                                    return rows;

                                                });
                                            }

                                            // Non-item fields
                                            const key = field;
                                            return (
                                                <tr key={key} className={match ? 'row-match' : 'row-mismatch'}>
                                                    <td>{fIdx + 1}</td>
                                                    {/* {section === 'Itemized Details' && <td></td>} */}
                                                    <td><strong>{key}</strong></td>
                                                    <td>{typeof inv === 'object' ? Object.entries(inv).map(([k, v]) => <div key={k}><strong>{k}</strong>: {v}</div>) : inv ?? '-'}</td>
                                                    <td>{typeof po === 'object' ? JSON.stringify(po) : po ?? '-'}</td>
                                                    <td>{typeof grn === 'object' ? JSON.stringify(grn) : grn ?? '-'}</td>
                                                    <td className={`match-col ${match ? 'match-yes' : 'match-no'}`}>
                                                        {match ? (
                                                            <>
                                                                <FaCheckCircle style={{ color: '#22c55e', marginRight: 4 }} /> Match
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaTimesCircle style={{ color: '#ef4444', marginRight: 4 }} /> Mismatch
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="action-cell">
                                                        {match ? (
                                                            <span className="accepted">✔ Accepted</span>
                                                        ) : rejections[key] !== undefined ? (
                                                            <>
                                                                <div className="action-buttons-inline">
                                                                    <button className="approve" onClick={() => {
                                                                        const updated = { ...rejections };
                                                                        delete updated[key];
                                                                        setRejections(updated);
                                                                    }}>Accept</button>
                                                                </div>
                                                                <textarea
                                                                    className="reason-box"
                                                                    placeholder="Reason"
                                                                    value={rejectionComments[key] || ''}
                                                                    onChange={(e) => handleRejectionComment(key, e.target.value)}
                                                                />
                                                            </>
                                                        ) : (
                                                            <div className="action-buttons-inline">
                                                                <button className="approve" onClick={() => {
                                                                    const updated = { ...rejections };
                                                                    delete updated[key];
                                                                    setRejections(updated);
                                                                }}>Accept</button>
                                                                <button className="reject" onClick={() =>
                                                                    setRejections((prev) => ({ ...prev, [key]: '' }))
                                                                }>Reject</button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>


                                            );
                                        })}
                                    </tbody>

                                </table>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="action-buttons">
                <button className="reject">Save Draft</button>
                <button className="approve" onClick={handleMatchApprove}>Override & Approve</button>
                <button className="approve" onClick={() => alert('Creating Payable Invoice...')}>Create Payable Invoice</button>
            </div>
            <ViewDocumentModal isOpen={isModalOpen} onRequestClose={() => setModalOpen(false)} fileUrl={docUrl} />
        </div>
    );
};

export default MatchInvoice;