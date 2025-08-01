import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ViewDocumentModal from './Upload/ViewDocumentModal';
import '../components/styles/matchinvoice.css';
import { FaFileInvoice, FaTruckLoading, FaBoxOpen, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { BASE_URL } from '.././config'; // Import BASE_URL

// Define ActionCell outside the MatchInvoice component and wrap with React.memo
// This component should only re-render if its specific props change.
const ActionCell = React.memo(({
    fieldKey,
    isMatch,
    currentRejectionComment, // Pass only the relevant comment
    onCommentChange,         // Pass a specific handler for this field's comment
    isRejected,              // Indicate if this specific field is rejected
    onReject,                // Handler for rejecting this field
    onAccept                 // Handler for accepting this field
}) => {
    const MAX_CHARS = 200; // Define max characters for consistency

    // Calculate current character length
    const charCount = (currentRejectionComment || '').length;

    // Determine if max characters are reached
    const isMaxReached = charCount >= MAX_CHARS;

    if (isMatch) {
        return <span className="accepted"><FaCheckCircle /> Accepted</span>;
    }

    if (isRejected) {
        return (
            <>
                <div className="action-buttons-inline">
                    <button className="approve" onClick={onAccept}>Accept</button>
                </div>
                <textarea
                    className="reason-box"
                    placeholder="Reason for rejection..."
                    value={currentRejectionComment || ''}
                    onChange={(e) => onCommentChange(e.target.value)}
                    maxLength={MAX_CHARS} // Use the constant here
                />
                <div className={`char-count-message ${isMaxReached ? 'limit-reached' : ''}`}>
                    {isMaxReached ? (
                        `Max characters entered (${charCount}/${MAX_CHARS})`
                    ) : (
                        `${charCount}/${MAX_CHARS} characters`
                    )}
                </div>
            </>
        );
    }

    return (
        <div className="action-buttons-inline">
            <button className="approve" onClick={onAccept}>Accept</button>
            <button className="reject" onClick={onReject}>Reject</button>
        </div>
    );
});


const MatchInvoice = () => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [isModalOpen, setModalOpen] = useState(false);
    const [docUrl, setDocUrl] = useState('');
    const [matchData, setMatchData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editedInvoice, setEditedInvoice] = useState({});
    const [editedPO, setEditedPO] = useState({});
    const [editedGRN, setEditedGRN] = useState({});

    const [openSections, setOpenSections] = useState({});

    const [rejections, setRejections] = useState({});
    const [rejectionComments, setRejectionComments] = useState({});

    const toggleSection = (sectionName) => {
        setOpenSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    useEffect(() => {
        const fetchReconciliationData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${BASE_URL}/api/reconciliation/${invoiceId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Fetched reconciliation data:', data);

                setMatchData(data);

                const actualSections = Object.keys(data).filter(key => key !== 'invoiceId');

                if (actualSections.length > 0) {
                    const initialOpenSections = {
                        [actualSections[0]]: true
                    };
                    if (actualSections.includes('Line Items')) {
                        initialOpenSections['Line Items'] = true;
                    }
                    setOpenSections(initialOpenSections);
                }

            } catch (err) {
                console.error("❌ Error fetching reconciliation data:", err);
                setMatchData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchReconciliationData();
    }, [invoiceId]);

    const handleRejectionComment = useCallback((fieldKey, value) => {
        setRejectionComments(prev => ({
            ...prev,
            [fieldKey]: value
        }));
    }, []);

    const handleRejectField = useCallback((fieldKey) => {
        setRejections(prev => ({ ...prev, [fieldKey]: true }));
        setRejectionComments(prev => ({ ...prev, [fieldKey]: '' }));
    }, []);

    const handleAcceptField = useCallback((fieldKey) => {
        setRejections(prev => {
            const newState = { ...prev };
            delete newState[fieldKey];
            return newState;
        });
        setRejectionComments(prev => {
            const newState = { ...prev };
            delete newState[fieldKey];
            return newState;
        });
    }, []);

    const openViewer = (relativePath) => {
        if (!relativePath) {
            setDocUrl('not-found');
        } else {
            const fullUrl = `${BASE_URL}/${relativePath.replace(/^\/+/, '')}`;
            setDocUrl(fullUrl);
        }
        setModalOpen(true);
    };

    const handleMatchApprove = async () => {
        console.log("Approving with current state:", {
            invoiceId: matchData.invoiceId,
            status: 'reconciled',
            rejectionComments: rejectionComments,
            result: matchData
        });

        try {
            const response = await fetch(`${BASE_URL}/api/reconcile/${invoiceId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approved: true,
                    reason: JSON.stringify(rejectionComments),
                    result: matchData
                }),
            });

            const result = await response.json();
            if (result.success) {
                alert("✅ Invoice Approved (and reconciled)!");
                navigate('/invoice');
            } else {
                alert(`❌ Approval failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Approval failed:', error);
            alert('❌ An error occurred during approval.');
        }
    };

    if (loading) return <p className="loading">Loading match data...</p>;
    if (!matchData || Object.keys(matchData).length <= 1) return <p className="loading">No match data found for invoice ID: {invoiceId}.</p>;

    const calculateMatchStats = (fields) => {
        let match = 0, partialMatch = 0, mismatch = 0, missing = 0;
        Object.values(fields).forEach(fieldData => {
            if (typeof fieldData === 'object' && fieldData !== null && 'Status' in fieldData) {
                switch (fieldData.Status) {
                    case 'Matched': match++; break;
                    case 'PartiallyMatch': partialMatch++; break;
                    case 'NotMatch': mismatch++; break;
                    case 'Missing': missing++; break;
                    default: break;
                }
            } else if (typeof fieldData === 'object' && fieldData !== null) {
                const nestedStats = calculateMatchStats(fieldData);
                match += nestedStats.match;
                partialMatch += nestedStats.partialMatch;
                mismatch += nestedStats.mismatch;
                missing += nestedStats.missing;
            }
        });
        return { match, partialMatch, mismatch, missing };
    };

    const allSectionKeys = Object.keys(matchData).filter(key => key !== 'invoiceId');

    return (
        <div className="match-page">
            <h2 style={{ textAlign: 'center' }}>3-Way Invoice Match - Invoice ID: {invoiceId}</h2>

            <div className="comparison-table-container">
                <div className="comparison-table-scroll">
                    {allSectionKeys.map((sectionName, sIdx) => {
                        const sectionData = matchData[sectionName];
                        if (!sectionData || Object.keys(sectionData).length === 0) return null;

                        const isOpen = !!openSections[sectionName];

                        if (sectionName === 'Line Items') {
                            let totalMatch = 0, totalMismatch = 0, totalPartial = 0, totalMissing = 0;
                            Object.values(sectionData).forEach(itemGroup => {
                                const stats = calculateMatchStats(itemGroup);
                                totalMatch += stats.match;
                                totalMismatch += stats.mismatch;
                                totalPartial += stats.partialMatch;
                                totalMissing += stats.missing;
                            });

                            return (
                                <div className="section-wrapper" key={`section-itemized`}>
                                    <h3 className="section-title" onClick={() => toggleSection(sectionName)}>
                                        <div className="section-title-left">
                                            <span className={`accordion-icon ${isOpen ? 'open' : ''}`}></span>
                                            {sectionName}
                                        </div>
                                        <span className="match-count">
                                            <FaCheckCircle className="icon match-icon" />Match {totalMatch} |
                                            <FaTimesCircle className="icon mismatch-icon" />Mismatch {totalMismatch} |
                                            <span style={{ color: '#f59e0b' }}><FaBoxOpen className="icon" />Partial Match {totalPartial}</span> |
                                            <span style={{ color: '#6b7280' }}><FaFileInvoice className="icon" />Missing {totalMissing}</span>
                                        </span>
                                    </h3>
                                    <div className={`collapsible-content ${isOpen ? 'open' : ''}`}>
                                        <table className="compare-table itemized-table">
                                            <thead>
                                                <tr>
                                                    <th>Sr No</th>
                                                    <th>Field</th>
                                                    <th>Invoice</th>
                                                    <th>PO</th>
                                                    <th>GRN</th>
                                                    <th>Match Status</th>
                                                    <th>Comment</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(sectionData).flatMap(([srNo, fields]) => {
                                                    const fieldEntries = Object.entries(fields);
                                                    return fieldEntries.map(([fieldName, fieldData], index) => {
                                                        const fullFieldKey = `${srNo}-${fieldName}`;
                                                        const isMatched = fieldData.Status === 'Matched';
                                                        let rowClass = '';
                                                        if (fieldName === 'Matched_At_Row') rowClass = 'metadata-row';
                                                        else if (isMatched) rowClass = 'row-match';
                                                        else rowClass = 'row-mismatch';

                                                        return (
                                                            <tr key={fullFieldKey} className={rowClass}>
                                                                {index === 0 && <td rowSpan={fieldEntries.length}>{srNo.replace(/_/g, ' ')}</td>}
                                                                <td>{fieldName.replace(/_/g, ' ')}</td>
                                                                <td>{fieldData.Invoice_Value ?? '-'}</td>
                                                                <td>{fieldData.PO_Value ?? '-'}</td>
                                                                <td>{fieldData.GRN_Value ?? '-'}</td>
                                                                <td className={`match-col ${isMatched ? 'match-yes' : 'match-no'}`}>
                                                                    {fieldData.Status}
                                                                </td>
                                                                <td>{fieldData.Comment ?? '-'}</td>
                                                                <td className="action-cell">
                                                                    <ActionCell
                                                                        fieldKey={fullFieldKey}
                                                                        isMatch={isMatched}
                                                                        isRejected={rejections[fullFieldKey] !== undefined}
                                                                        currentRejectionComment={rejectionComments[fullFieldKey]}
                                                                        onCommentChange={(value) => handleRejectionComment(fullFieldKey, value)}
                                                                        onReject={() => handleRejectField(fullFieldKey)}
                                                                        onAccept={() => handleAcceptField(fullFieldKey)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        }

                        const { match, partialMatch, mismatch, missing } = calculateMatchStats(sectionData);
                        return (
                            <div className="section-wrapper" key={`section-${sIdx}`}>
                                <h3 className="section-title" onClick={() => toggleSection(sectionName)}>
                                    <div className="section-title-left">
                                        <span className={`accordion-icon ${isOpen ? 'open' : ''}`}></span>
                                        {sectionName.replace(/_/g, ' ')}
                                    </div>
                                    <span className="match-count">
                                        <FaCheckCircle className="icon match-icon" />Match {match} |
                                        <FaTimesCircle className="icon mismatch-icon" />Mismatch {mismatch} |
                                        <span style={{ color: '#f59e0b' }}><FaBoxOpen className="icon" />Partial Match {partialMatch}</span> |
                                        <span style={{ color: '#6b7280' }}><FaFileInvoice className="icon" />Missing {missing}</span>
                                    </span>
                                </h3>
                                <div className={`collapsible-content ${isOpen ? 'open' : ''}`}>
                                    <table className="compare-table">
                                        <thead>
                                            <tr>
                                                <th>Field</th>
                                                <th>Invoice</th>
                                                <th>PO</th>
                                                <th>GRN</th>
                                                <th>Status</th>
                                                <th>Comment</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(sectionData).map(([fieldName, fieldData]) => {
                                                const fullFieldKey = `${sectionName}-${fieldName}`;
                                                const isMatched = fieldData.Status === 'Matched';
                                                return (
                                                    <tr key={fullFieldKey} className={isMatched ? 'row-match' : 'row-mismatch'}>
                                                        <td>
                                                            <div className="cell-title">{fieldName.replace(/_/g, ' ')}</div>
                                                            <div className="cell-subtitle">{fieldData.Description}</div>
                                                        </td>
                                                        <td>{fieldData.Invoice_Value ?? '-'}</td>
                                                        <td>{fieldData.PO_Value ?? '-'}</td>
                                                        <td>{fieldData.GRN_Value ?? '-'}</td>
                                                        <td>{fieldData.Status}</td>
                                                        <td>{fieldData.Comment ?? '-'}</td>
                                                        <td className="action-cell">
                                                            <ActionCell
                                                                fieldKey={fullFieldKey}
                                                                isMatch={isMatched}
                                                                isRejected={rejections[fullFieldKey] !== undefined}
                                                                currentRejectionComment={rejectionComments[fullFieldKey]}
                                                                onCommentChange={(value) => handleRejectionComment(fullFieldKey, value)}
                                                                onReject={() => handleRejectField(fullFieldKey)}
                                                                onAccept={() => handleAcceptField(fullFieldKey)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
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
        </div>
    );
};

export default MatchInvoice;