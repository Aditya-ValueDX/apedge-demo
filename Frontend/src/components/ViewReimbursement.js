import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Calendar, User, FileText, CheckCircle, XCircle, AlertCircle, Loader2, DollarSign, Clock // Ensure Clock is here
} from 'lucide-react';
import '../components/styles/ViewReimbursement.css';
import { BASE_URL } from '.././config'; // Import BASE_URL

// Custom Modal Component - now more flexible
const ReasonModal = ({ show, onClose, onSubmit, actionType, title, message }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (reason.trim() === '') {
            setError('Reason cannot be empty.');
            return;
        }
        setError('');
        onSubmit(reason);
        setReason(''); // Clear reason after submission
    };

    if (!show) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{title}</h3>
                <p>{message}</p>
                <textarea
                    value={reason}
                    onChange={(e) => {
                        setReason(e.target.value);
                        if (error && e.target.value.trim() !== '') {
                            setError('');
                        }
                    }}
                    placeholder="Enter reason here..."
                    rows="4"
                    className={error ? 'input-error' : ''}
                ></textarea>
                {error && <p className="error-message-modal">{error}</p>}
                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className={`submit-btn ${actionType === 'approved' ? 'approve-btn' : 'reject-btn'}`} onClick={handleSubmit}>
                        {actionType === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ViewReimbursement = () => {
    const { id } = useParams();
    const [reimbursement, setReimbursement] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false); // State for Approve modal
    const [showRejectModal, setShowRejectModal] = useState(false);   // State for Reject modal
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        } else {
            console.error("No user found in session. Approval actions will be unavailable.");
        }
    }, []);

    useEffect(() => {
        const fetchReimbursement = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${BASE_URL}/api/reimbursements/${id}`);
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                const data = await res.json();
                setReimbursement(data.error ? null : data);
            } catch (err) {
                console.error("Error fetching reimbursement:", err);
                setReimbursement(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReimbursement();
    }, [id]);

    const initiateApproveAction = () => {
        setShowApproveModal(true);
    };

    const initiateRejectAction = () => {
        setShowRejectModal(true);
    };

    const handleAction = async (newStatus, reason) => {
        // Close both modals, only one will be open
        setShowApproveModal(false);
        setShowRejectModal(false);

        if (!reimbursement || !currentUser) {
            alert("Action cannot be completed. Missing user data or reimbursement details.");
            return;
        }

        const confirmation = window.confirm(`Are you sure you want to ${newStatus} this reimbursement?`);
        if (!confirmation) {
            return;
        }

        const approverName = currentUser.name || currentUser.companyName || 'Unknown User';

        try {
            const response = await fetch(`${BASE_URL}/api/reimbursements/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, user: { name: approverName }, reason: reason }),
            });
            const result = await response.json();

            if (result.success) {
                setReimbursement(result.reimbursement);
                setIsRedirecting(true);

                setTimeout(() => {
                    navigate('/reimbursement-queue');
                }, 1500);

            } else {
                console.error('Failed to update status:', result.error);
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('API call failed:', error);
            alert("An error occurred while communicating with the server.");
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle className="status-icon status-icon--approved" />;
            case 'rejected': return <XCircle className="status-icon status-icon--rejected" />;
            case 'pending': return <Clock className="status-icon status-icon--pending" />;
            default: return <AlertCircle className="status-icon status-icon--default" />;
        }
    };

    const handleBack = () => {
        navigate('/reimbursement-queue');
    };

    if (isLoading) {
        return (
            <div className="page-container">
                <div className="content-wrapper">
                    <div className="loading-skeleton">
                        <div className="skeleton-header"></div>
                        <div className="skeleton-card">
                            <div className="skeleton-title"></div>
                            <div className="skeleton-grid">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="skeleton-item">
                                        <div className="skeleton-label"></div>
                                        <div className="skeleton-value"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!reimbursement) {
        return (
            <div className="page-container page-container--centered">
                <div className="error-state">
                    <XCircle className="error-icon" />
                    <h2 className="error-title">Reimbursement Not Found</h2>
                    <p className="error-message">The requested reimbursement with ID '{id}' could not be loaded.</p>
                </div>
            </div>
        );
    }

    const allowedExpenses = reimbursement["Section 1: Allowed for Reimbursement"]?.Expenses || [];
    const totalAllowedAmount = reimbursement["Section 1: Allowed for Reimbursement"]?.["Total Amount for Reimbursement (INR)"] || "0.00";
    const notAllowedExpenses = reimbursement["Section 2: Not Allowed for Reimbursement"]?.Expenses || [];
    const totalNotAllowedAmount = reimbursement["Section 2: Not Allowed for Reimbursement"]?.["Total Not Allowed (INR)"] || "0.00";

    return (
        <div className="page-container">
            {/* Redirecting Popup Overlay */}
            {isRedirecting && (
                <div className="redirecting-overlay">
                    <div className="redirecting-box">
                        <Loader2 className="spinner" size={40} />
                        <h3>Status Updated!</h3>
                        <p>Redirecting to the reimbursement queue...</p>
                    </div>
                </div>
            )}

            {/* Approve Reason Modal */}
            <ReasonModal
                show={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onSubmit={(reason) => handleAction('approved', reason)}
                actionType="approved"
                title="Approve Reimbursement"
                message="Please provide a reason for approving this reimbursement:"
            />

            {/* Reject Reason Modal */}
            <ReasonModal
                show={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onSubmit={(reason) => handleAction('rejected', reason)}
                actionType="rejected"
                title="Reject Reimbursement"
                message="Please provide a reason for rejecting this reimbursement:"
            />

            <div className="content-wrapper">
                {/* Header */}
                <div className="page-header">
                    <button className="back-button" onClick={handleBack} disabled={isRedirecting}>
                        <ArrowLeft className="back-icon" />
                        <span className="back-text">
                            Back to Reimbursement Queue
                        </span>
                    </button>
                </div>

                {/* Main Card */}
                <div className="main-card">
                    <div className="card-header">
                        <div className="header-content">
                            <div className="header-info">
                                <div className="header-title-row">
                                    <FileText className="title-icon" />
                                    <h1 className="main-title">Reimbursement Details</h1>
                                </div>
                                <p className="reimbursement-id">ID: {reimbursement.id}</p>
                            </div>
                            <div className="header-actions">
                                <div className={`status-badge status-badge--${reimbursement.status}`}>
                                    {getStatusIcon(reimbursement.status)}
                                    <span className="status-text">{reimbursement.status}</span>
                                </div>

                                
                            </div>
                        </div>
                    </div>

                    <div className="card-content">
                        {/* Employee Information */}
                        <div className="info-section">
                            <h3 className="section-title"><User className="section-icon" /> Employee Information</h3>
                            {/* Modified info-items for grid layout */}
                            <div className="info-items employee-info-grid">
                                <div className="info-item">
                                    <div className="info-label">Employee Name</div>
                                    <div className="info-value">{reimbursement.employeeName}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Employee ID</div>
                                    <div className="info-value">{reimbursement.employeeId}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Department</div>
                                    <div className="info-value">{reimbursement.department}</div>
                                </div>
                            </div>
                        </div>

                        {/* Allowed for Reimbursement Section */}
                        <div className="amount-section" style={{ backgroundColor: '#e6ffe6', borderColor: '#4CAF50' }}>
                            <div className="amount-header">
                                <CheckCircle className="amount-icon" style={{ color: '#4CAF50' }} />
                                <span className="amount-label" style={{ color: '#2E8B57' }}>Allowed for Reimbursement</span>
                            </div>
                            {allowedExpenses.length > 0 ? (
                                <div className="expense-table-container">
                                    <table className="expense-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Vendor</th>
                                                <th>Expense Type</th>
                                                <th className="amount-col">Amount (INR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allowedExpenses.map((expense, index) => (
                                                <tr key={index}>
                                                    <td>{expense.Date}</td>
                                                    <td>{expense.Vendor}</td>
                                                    <td>{expense["Expense Type"]}</td>
                                                    <td className="amount-col">₹{parseFloat(expense["Expense Amount (INR)"]).toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="info-value">No expenses allowed for reimbursement.</p>
                            )}
                            <div className="amount-value" style={{ color: '#2E8B57', marginTop: '15px', borderTop: '1px dashed #4CAF50', paddingTop: '10px' }}>
                                Total Allowed: ₹{parseFloat(totalAllowedAmount).toLocaleString('en-IN')}
                            </div>
                        </div>

                        {/* Not Allowed for Reimbursement Section */}
                        <div className="amount-section" style={{ backgroundColor: '#ffe6e6', borderColor: '#F44336', marginTop: '20px' }}>
                            <div className="amount-header">
                                <XCircle className="amount-icon" style={{ color: '#F44336' }} />
                                <span className="amount-label" style={{ color: '#B00020' }}>Not Allowed for Reimbursement</span>
                            </div>
                            {notAllowedExpenses.length > 0 ? (
                                <div className="expense-table-container">
                                    <table className="expense-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Vendor</th>
                                                <th>Expense Type</th>
                                                <th className="amount-col">Amount (INR)</th>
                                                <th>Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {notAllowedExpenses.map((expense, index) => (
                                                <tr key={index}>
                                                    <td>{expense.Date}</td>
                                                    <td>{expense.Vendor}</td>
                                                    <td>{expense["Expense Type"]}</td>
                                                    <td className="amount-col">₹{parseFloat(expense["Expense Amount (INR)"]).toLocaleString('en-IN')}</td>
                                                    <td>{expense["Reimbursement Eligibility"].split('-')[1]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="info-value">No expenses disallowed for reimbursement.</p>
                            )}
                            <div className="amount-value" style={{ color: '#B00020', marginTop: '15px', borderTop: '1px dashed #F44336', paddingTop: '10px' }}>
                                Total Not Allowed: ₹{parseFloat(totalNotAllowedAmount).toLocaleString('en-IN')}
                            </div>
                        </div>

                        {/* Timeline section */}
                        <div className="timeline-section">
                            <h3 className="section-title"><Calendar className="section-icon" /> Timeline</h3>
                            <div className="timeline">
                                <div className="timeline-line"></div>
                                <div className="timeline-items">
                                    <div className="timeline-item">
                                        <div className="timeline-icon timeline-icon--submitted"><FileText className="timeline-icon-svg" /></div>
                                        <div className="timeline-content timeline-content--submitted">
                                            <div className="timeline-title">Submitted</div>
                                            <div className="timeline-date">{new Date(reimbursement.submissionDate).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</div>
                                        </div>
                                    </div>
                                    {reimbursement.status === 'approved' && reimbursement.approvalDate && (
                                        <div className="timeline-item">
                                            <div className="timeline-icon timeline-icon--approved"><CheckCircle className="timeline-icon-svg" /></div>
                                            <div className="timeline-content timeline-content--approved">
                                                <div className="timeline-title">
                                                    Approved by {reimbursement.approvedBy}
                                                    {reimbursement.approverRole && ` (${reimbursement.approverRole})`}
                                                </div>
                                                <div className="timeline-date">{new Date(reimbursement.approvalDate).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</div>
                                                {reimbursement.approvalReason && (
                                                    <div className="timeline-reason">Reason: {reimbursement.approvalReason}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {reimbursement.status === 'rejected' && reimbursement.approvalDate && (
                                        <div className="timeline-item">
                                            <div className="timeline-icon timeline-icon--rejected"><XCircle className="timeline-icon-svg" /></div>
                                            <div className="timeline-content timeline-content--rejected">
                                                <div className="timeline-title">
                                                    Rejected by {reimbursement.approvedBy}
                                                    {reimbursement.approverRole && ` (${reimbursement.approverRole})`}
                                                </div>
                                                <div className="timeline-date">{new Date(reimbursement.approvalDate).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</div>
                                                {reimbursement.rejectionReason && (
                                                    <div className="timeline-reason">Reason: {reimbursement.rejectionReason}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {reimbursement.status === 'pending' && (
                                        <div className="timeline-item">
                                            <div className="timeline-icon timeline-icon--pending"><Clock className="timeline-icon-svg" /></div>
                                            <div className="timeline-content timeline-content--pending">
                                                <div className="timeline-title">Awaiting Approval</div>
                                                <div className="timeline-date">Pending review by supervisor</div>
                                            </div>
                                        </div>
                                    )}
                                    
                                </div>
                            </div>
                        </div>
                        <div className="header-actions">
                                
                                {reimbursement.status === 'pending' && currentUser && (
                                    <div className="action-buttons">
                                        <button onClick={initiateApproveAction} className="action-btn action-btn--approve" disabled={isRedirecting}>
                                            <CheckCircle className="btn-icon" /> Approve
                                        </button>
                                        <button onClick={initiateRejectAction} className="action-btn action-btn--reject" disabled={isRedirecting}>
                                            <XCircle className="btn-icon" /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                    </div>
                </div>
            </div>

            {/* CSS for the popup and modal */}
            <style>{`
                .redirecting-overlay, .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                    backdrop-filter: blur(5px);
                }
                .redirecting-box, .modal-content {
                    background-color: white;
                    color: #333;
                    padding: 30px 40px;
                    border-radius: 12px;
                    text-align: center;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                .redirecting-box h3, .modal-content h3 {
                    margin: 0;
                    font-size: 1.2rem;
                }
                .redirecting-box p, .modal-content p {
                    margin: 0;
                    color: #666;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spinner {
                    animation: spin 1s linear infinite;
                    color: #2563eb; /* Blue color */
                }
                .timeline-reason {
                    font-size: 0.875rem;
                    color: #555;
                    margin-top: 5px;
                    font-style: italic;
                }

                /* Modal specific styles */
                .modal-content {
                    min-width: 350px;
                    max-width: 500px;
                    text-align: left;
                }
                .modal-content textarea {
                    width: 100%;
                    padding: 10px;
                    margin-top: 10px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    font-size: 1rem;
                    box-sizing: border-box; /* Include padding in width */
                    resize: vertical; /* Allow vertical resize */
                }
                .modal-content .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    width: 100%;
                    margin-top: 20px;
                }
                .modal-content .cancel-btn {
                    background-color: #e0e0e0;
                    color: #333;
                    padding: 8px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                .modal-content .cancel-btn:hover {
                    background-color: #d0d0d0;
                }
                .modal-content .submit-btn {
                    color: white;
                    padding: 8px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                .modal-content .approve-btn {
                    background-color: #22c55e;
                }
                .modal-content .approve-btn:hover {
                    background-color: #16a34a;
                }
                .modal-content .reject-btn {
                    background-color: #ef4444;
                }
                .modal-content .reject-btn:hover {
                    background-color: #dc2626;
                }
                .modal-content .input-error {
                    border-color: #ef4444;
                }
                .error-message-modal {
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-top: 5px;
                    align-self: flex-start; /* Align error message to the left */
                }

                /* Table specific styles */
                .expense-table-container {
                    margin-top: 15px;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    border: 1px solid #e2e8f0;
                }

                .expense-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .expense-table th,
                .expense-table td {
                    padding: 12px 15px;
                    text-align: left;
                    border-bottom: 1px solid #e2e8f0;
                }

                .expense-table th {
                    background-color: #f8fafc;
                    color: #475569;
                    font-weight: 600;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                }

                .expense-table tbody tr:last-child td {
                    border-bottom: none;
                }

                .expense-table tbody tr:hover {
                    background-color: #f0f4f8;
                }

                .expense-table td {
                    color: #334155;
                    font-size: 0.95rem;
                }

                .expense-table .amount-col {
                    text-align: right;
                    font-weight: 500;
                }

                /* Specific colors for allowed/not allowed table headers */
                .amount-section[style*="e6ffe6"] .expense-table th { /* Allowed */
                    background-color: #d1fae5;
                    color: #047857;
                }
                .amount-section[style*="ffe6e6"] .expense-table th { /* Not Allowed */
                    background-color: #fee2e2;
                    color: #b91c1c;
                }

                /* Employee Info Grid (New Styles) */
                .employee-info-grid {
                    display: grid;
                    grid-template-columns: repeat(1, 1fr); /* Default to 1 column on small screens */
                    gap: 1rem; /* Gap between items */
                }

                @media (min-width: 640px) { /* On medium screens and up */
                    .employee-info-grid {
                        grid-template-columns: repeat(3, 1fr); /* 3 columns */
                    }
                }
            `}</style>
        </div>
    );
};

export default ViewReimbursement;