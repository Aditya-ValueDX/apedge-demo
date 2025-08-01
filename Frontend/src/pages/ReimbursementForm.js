import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, PlusCircle, Download, X, MessageSquare, UploadCloud, Eye } from 'lucide-react';
import { BILL_TYPES, REIMBURSEMENT_STAGES, REIMBURSEMENT_STATUSES, API_BASE_URL } from '../utils/config'; // Assuming these exist
import ViewDocumentModal from '../components/ViewDocumentModal'; // Assuming this component exists
import TableComponent from '../components/TableComponent'; // Assuming this component exists
import TextDisplayModal from '../components/TextDisplayModal'; // Assuming this component exists
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReimbursementForm = ({ navigateTo, requestId, isReadOnly, userId }) => {
  const [requestDetails, setRequestDetails] = useState({
    id: requestId || `REQ${Date.now()}`,
    overallComments: '',
    approver: '',
    attachedBills: [], // This will now hold both pending File objects and uploaded bill objects
    requesterId: userId, // Initialize with userId
  });
  const [lineItems, setLineItems] = useState([
    { id: 1, billNo: '', billType: '', vendor: '', date: '', amount: '', requesterComments: '', botRemarks: 'Eligible: Initial check.' }
  ]);
  const [activeTab, setActiveTab] = useState('details');
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedFileForModal, setSelectedFileForModal] = useState(null);

  const [isBotRemarksModalOpen, setIsBotRemarksModalOpen] = useState(false);
  const [selectedBotRemark, setSelectedBotRemark] = useState('');

  // New state for drag & drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Update requesterId if userId prop changes (e.g., on initial load or user switch)
  useEffect(() => {
    setRequestDetails(prev => ({
      ...prev,
      requesterId: userId,
    }));
  }, [userId]);

  // Load existing request data if requestId is provided (for editing/viewing)
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (requestId) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/reimbursements/${requestId}`);
          if (response.ok) {
            const data = await response.json();
            // Ensure attachedBills URLs are absolute for display
            const updatedAttachedBills = data.attachedBills.map(bill => ({
              ...bill,
              url: bill.url.startsWith('http') ? bill.url : `${API_BASE_URL}${bill.url}`,
              isPending: false // Existing bills are not pending
            }));
            setRequestDetails({ ...data, attachedBills: updatedAttachedBills });
            setLineItems(data.lineItems || []); // Ensure lineItems are loaded
          } else {
            console.error(`Failed to fetch request ${requestId}:`, response.statusText);
            toast.error(`Failed to load request ${requestId}.`);
            setRequestDetails(prev => ({ ...prev, id: requestId, requesterId: userId }));
            setLineItems([{ id: 1, billNo: '', billType: '', vendor: '', date: '', amount: '', requesterComments: '', botRemarks: 'Eligible: Initial check.' }]);
          }
        } catch (error) {
          console.error('Error fetching request details:', error);
          toast.error('Error connecting to the server to fetch request details.');
          setRequestDetails(prev => ({ ...prev, id: requestId, requesterId: userId }));
          setLineItems([{ id: 1, billNo: '', billType: '', vendor: '', date: '', amount: '', requesterComments: '', botRemarks: 'Eligible: Initial check.' }]);
        }
      }
    };

    fetchRequestDetails();
  }, [requestId, API_BASE_URL, userId]);

  // Function to add files to pending state
  const addPendingFiles = useCallback((files) => {
    if (isReadOnly) return;

    const newPendingBills = Array.from(files).map(file => ({
      name: file.name,
      type: file.type,
      file: file, // Store the actual File object
      isPending: true, // Mark as pending
    }));

    setRequestDetails(prev => ({
      ...prev,
      attachedBills: [...prev.attachedBills, ...newPendingBills]
    }));
    toast.info(`Added ${newPendingBills.length} file(s) for upload on submission.`);
  }, [isReadOnly]);

  // Handler for file input change
  const handleBillUpload = (e) => {
    addPendingFiles(e.target.files);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault(); // Essential to allow drop
    if (isReadOnly) return;
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    if (isReadOnly) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); // Essential to prevent default browser behavior (e.g., opening file)
    if (isReadOnly) return;
    setIsDraggingOver(false); // Reset drag over state
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addPendingFiles(e.dataTransfer.files);
    }
  };

  // Remove an attached bill (handles both pending and uploaded)
  const removeAttachedBill = (indexToRemove) => {
    if (isReadOnly) return;

    setRequestDetails(prev => {
      const billToRemove = prev.attachedBills[indexToRemove];
      // If it's a pending file, revoke the object URL to free up memory
      if (billToRemove && billToRemove.isPending && billToRemove.file) {
        URL.revokeObjectURL(URL.createObjectURL(billToRemove.file));
      }
      toast.warn(`Removed bill: ${billToRemove.name}`, { toastId: `removed-bill-${billToRemove.name}` });
      return {
        ...prev,
        attachedBills: prev.attachedBills.filter((_, index) => index !== indexToRemove)
      };
    });
  };

  // Handle changes in line item fields
  const handleLineItemChange = (id, field, value) => {
    if (isReadOnly) return;

    setLineItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Add a new line item
  const addLineItem = () => {
    if (isReadOnly) return;

    setLineItems(prev => [
      ...prev,
      { id: prev.length ? Math.max(...prev.map(item => item.id)) + 1 : 1, billNo: '', billType: '', vendor: '', date: '', amount: '', requesterComments: '', botRemarks: 'Pending Validation' }
    ]);
    toast.info('New line item added.');
  };

  // Delete a line item
  const deleteLineItem = (id) => {
    if (isReadOnly) return;

    setLineItems(prev => prev.filter(item => item.id !== id));
    toast.warn('Line item deleted.');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    // --- Validation: At least one file or one line item with an amount is compulsory ---
    const hasValidLineItems = lineItems.some(item => parseFloat(item.amount) > 0);
    const hasAttachedBills = requestDetails.attachedBills.length > 0;

    if (!hasValidLineItems && !hasAttachedBills) {
      toast.warn("Please add at least one line item with an amount greater than 0, or attach one bill to submit the request.");
      return; // Prevent submission
    }

    // First, upload all pending files
    const uploadedBills = await Promise.all(
      requestDetails.attachedBills.map(async (bill) => {
        if (bill.isPending && bill.file) {
          const formData = new FormData();
          formData.append('bills', bill.file);

          try {
            const response = await fetch(`${API_BASE_URL}/api/upload/bills`, {
              method: 'POST',
              body: formData,
            });
            const result = await response.json();

            if (response.ok && result.success && result.files.length > 0) {
              const uploadedFile = result.files[0];
              // Revoke the temporary object URL as the file is now uploaded
              URL.revokeObjectURL(URL.createObjectURL(bill.file));
              toast.success(`Successfully uploaded bill: ${uploadedFile.name}`);
              return {
                name: uploadedFile.name,
                url: uploadedFile.url, // This is the relative URL from backend
                type: uploadedFile.type,
                isPending: false, // Mark as no longer pending
              };
            } else {
              const errorMessage = result.message || `Failed to upload file ${bill.name}.`;
              console.error(`File upload failed for ${bill.name}:`, errorMessage);
              toast.error(`File upload failed for ${bill.name}: ${errorMessage}`);
              return { ...bill, isPending: true }; // Keep it pending if upload fails
            }
          } catch (error) {
            console.error(`Error uploading file ${bill.name}:`, error);
            toast.error(`Error uploading file ${bill.name}. Please check server connection.`);
            return { ...bill, isPending: true }; // Keep it pending if error occurs
          }
        }
        return bill; // Return non-pending bills as they are
      })
    );

    // Filter out any bills that failed to upload and are still marked as pending
    const successfullyUploadedBills = uploadedBills.filter(bill => !bill.isPending);
    const failedToUploadBills = uploadedBills.filter(bill => bill.isPending);

    if (failedToUploadBills.length > 0) {
      toast.warn("Some files failed to upload. Please try again.");
    }

    const payload = {
      ...requestDetails,
      requesterId: userId, // Ensure userId is included in the payload
      // Ensure attachedBills URLs are stored as relative paths on the backend
      // and only include successfully uploaded bills
      attachedBills: successfullyUploadedBills.map(bill => ({
        ...bill,
        url: bill.url.replace(API_BASE_URL, '') // Remove base URL before sending to backend
      })),
      lineItems: lineItems,
    };

    try {
      const url = requestId
        ? `${API_BASE_URL}/api/reimbursements/${requestId}`
        : `${API_BASE_URL}/api/reimbursements`;
      const method = requestId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        const message = requestId
          ? 'Reimbursement request updated successfully!'
          : 'Reimbursement request submitted successfully!';
        toast.success(message);
        navigateTo('request_list');
      } else {
        const errorMessage = result.message || 'Submission/Update failed.';
        console.error('Submission/Update failed:', errorMessage);
        toast.error(`Submission/Update failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error during submission/update:', error);
      toast.error('Error connecting to the server for submission/update.');
    }
  };

  // Modals for viewing documents and full BOT Remarks
  const openDocumentViewModal = (file) => {
    setSelectedFileForModal(file);
    setIsDocumentModalOpen(true);
  };

  const closeDocumentViewModal = () => {
    setIsDocumentModalOpen(false);
    setSelectedFileForModal(null);
  };

  const openBotRemarksModal = (remark) => {
    setIsBotRemarksModalOpen(true);
    setSelectedBotRemark(remark);
  };

  const closeBotRemarksModal = () => {
    setIsBotRemarksModalOpen(false);
    setSelectedBotRemark('');
  };

  const dummyApprovers = ['John Doe (Manager)', 'Jane Smith (Director)', 'Robert Johnson (VP)'];

  // Column definitions for the TableComponent
  const lineItemColumns = React.useMemo(() => {
    const baseColumns = [
      {
        key: 'billNo',
        header: 'Bill No',
        sortable: true,
        filterable: !isReadOnly && !!requestId, // Only filterable if not read-only AND requestId exists
        filterType: 'text',
        render: (item) => (
          <input
            type="text"
            className={`table-input ${isReadOnly ? 'read-only' : ''}`}
            value={item.billNo}
            onChange={(e) => handleLineItemChange(item.id, 'billNo', e.target.value)}
            readOnly={isReadOnly}
          />
        )
      },
      {
        key: 'billType',
        header: 'Bill Type',
        sortable: true,
        filterable: !isReadOnly && !!requestId, // Only filterable if not read-only AND requestId exists
        filterType: 'select',
        filterOptions: () => BILL_TYPES,
        render: (item) => (
          <select
            className={`table-select ${isReadOnly ? 'read-only' : ''}`}
            value={item.billType}
            onChange={(e) => handleLineItemChange(item.id, 'billType', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="">Select Type</option>
            {BILL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        )
      },
      {
        key: 'vendor',
        header: 'Vendor',
        sortable: true,
        filterable: !isReadOnly && !!requestId, // Only filterable if not read-only AND requestId exists
        filterType: 'text',
        render: (item) => (
          <input
            type="text"
            className={`table-input ${isReadOnly ? 'read-only' : ''}`}
            value={item.vendor}
            onChange={(e) => handleLineItemChange(item.id, 'vendor', e.target.value)}
            readOnly={isReadOnly}
          />
        )
      },
      {
        key: 'date',
        header: 'Date',
        sortable: true,
        filterable: !isReadOnly && !!requestId, // Only filterable if not read-only AND requestId exists
        filterType: 'date',
        render: (item) => (
          <input
            type="date"
            className={`table-input ${isReadOnly ? 'read-only' : ''}`}
            value={item.date}
            onChange={(e) => handleLineItemChange(item.id, 'date', e.target.value)}
            readOnly={isReadOnly}
          />
        )
      },
      {
        key: 'amount',
        header: 'Amount',
        sortable: true,
        filterable: !isReadOnly && !!requestId, // Only filterable if not read-only AND requestId exists
        filterType: 'number',
        render: (item) => (
          <input
            type="number"
            className={`table-input ${isReadOnly ? 'read-only' : ''}`}
            value={item.amount}
            onChange={(e) => handleLineItemChange(item.id, 'amount', e.target.value)}
            step="0.01"
            readOnly={isReadOnly}
          />
        )
      },
      {
        key: 'requesterComments',
        header: 'Requester Comments',
        sortable: true,
        filterable: !isReadOnly && !!requestId, // Only filterable if not read-only AND requestId exists
        filterType: 'text',
        render: (item) => (
          <input
            type="text"
            className={`table-input ${isReadOnly ? 'read-only' : ''}`}
            value={item.requesterComments}
            onChange={(e) => handleLineItemChange(item.id, 'requesterComments', e.target.value)}
            readOnly={isReadOnly}
          />
        )
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (item) => (
          !isReadOnly && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteLineItem(item.id); }}
              className="icon-button text-red"
              title="Delete Line Item"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )
        )
      }
    ];

    // Conditionally add 'botRemarks' column based on whether requestId exists (i.e., it's an existing request)
    if (requestId) { // Show BOT Remarks if it's an existing request (regardless of readOnly)
      baseColumns.splice(baseColumns.length - 1, 0, { // Insert before 'actions'
        key: 'botRemarks',
        header: 'BOT Remarks',
        sortable: true,
        filterable: !isReadOnly && !!requestId, // Only filterable if not read-only AND requestId exists
        filterType: 'text',
        render: (item) => (
          <div className="bot-remarks-cell">
            <span className={`font-medium ${item.botRemarks.includes('Eligible') ? 'text-green-700' : 'text-red-600'}`}>
              {item.botRemarks.length > 30 ? item.botRemarks.substring(0, 27) + '...' : item.botRemarks}
            </span>
            {item.botRemarks.length > 30 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openBotRemarksModal(item.botRemarks); }}
                className="icon-button text-blue"
                title="View Full BOT Remarks"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      });
    }
    return baseColumns;
  }, [isReadOnly, requestId, handleLineItemChange, deleteLineItem, openBotRemarksModal]);

  // State for TableComponent's internal sorting and filtering
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});

  return (
    <div className="card-container reimbursement-form-container">
      {/* Header with Title and Compact Upload Area */}
      <div className="form-header-wrapper">
        <div className="form-title-and-separator"> {/* New wrapper for title and its separator */}
          <h2 className="section-title">
            {isReadOnly ? `View Request: ${requestDetails.id}` : (requestId ? `Edit Request: ${requestDetails.id}` : 'New Reimbursement Request')}
          </h2>
          <div className="section-separator"></div> {/* New class for this specific separator */}
        </div>

        {!isReadOnly && (
          <div
            className={`file-upload-area-compact ${isDraggingOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              onChange={handleBillUpload}
              className="upload-input"
              id="billUploadCompact"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <label htmlFor="billUploadCompact" className="upload-label-compact">
              <UploadCloud className="upload-icon-compact" /> {/* Changed icon */}
              <div className="upload-text-group">
                <span>Upload Bills</span>
                <span className="upload-subtext">Drag & Drop or Click</span>
              </div>
            </label>
          </div>
        )}
      </div>
      {/* Removed the redundant section-separator here */}

      {/* Tabs for Details and Attached Bills */}
      <div className="tab-nav">
        <button
          onClick={() => setActiveTab('details')}
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
        >
          Request Details
        </button>
        <button
          onClick={() => setActiveTab('attachments')}
          className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
        >
          Attached Bills ({requestDetails.attachedBills.length})
        </button>
      </div>

      {activeTab === 'details' && (
        <form onSubmit={handleSubmit}>
          {/* Line Item Table */}
          <div className="overflow-x-auto">
            <TableComponent
              data={lineItems}
              columns={lineItemColumns}
              sortField={sortField}
              setSortField={setSortField}
              sortAsc={sortAsc}
              setSortAsc={setSortAsc}
              page={page}
              setPage={setPage}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              emptyMessage="No line items added yet."
              pageSize={5}
            />
          </div>

          {!isReadOnly && (
            <div className="form-actions-bottom">
              <button
                type="button"
                onClick={addLineItem}
                className="btn-secondary"
              >
                <PlusCircle className="nav-icon mr-2" /> Add Line Item
              </button>
            </div>
          )}

          {/* Overall Comments and Approver Selection */}
          <div className="form-grid-2-col">
            <div className="form-group">
              <label htmlFor="overallComments" className="form-label">Overall Requester Comments</label>
              <textarea
                id="overallComments"
                className={`form-textarea ${isReadOnly ? 'read-only' : ''} fixed-height-textarea`}
                rows="3"
                value={requestDetails.overallComments}
                onChange={(e) => setRequestDetails(prev => ({ ...prev, overallComments: e.target.value }))}
                placeholder="Any general comments for this request..."
                readOnly={isReadOnly}
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="approver" className="form-label">Select Approver</label>
              <select
                id="approver"
                className={`form-select ${isReadOnly ? 'read-only' : ''} fixed-height-select`}
                value={requestDetails.approver}
                onChange={(e) => setRequestDetails(prev => ({ ...prev, approver: e.target.value }))}
                required
                disabled={isReadOnly}
              >
                <option value="">-- Select an Approver --</option>
                {dummyApprovers.map((approver, index) => (
                  <option key={index} value={approver}>{approver}</option>
                ))}
              </select>
            </div>
          </div>

          {!isReadOnly && (
            <div className="form-submit-area">
              <button
                type="submit"
                className="btn-primary"
              >
                Submit for Approval
              </button>
              {/* Conditional rendering for Cancel button: only if requestId exists (i.e., editing an existing request) */}
              {!!requestId && (
                <button
                  type="button"
                  onClick={() => navigateTo('request_list')}
                  className="btn-secondary ml-4"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </form>
      )}

      {activeTab === 'attachments' && (
        <div className="attachments-tab-content">
          <div className="attachments-grid">
            {requestDetails.attachedBills.length === 0 ? (
              <p className="text-gray-600 text-center col-span-full py-10">No bills attached yet. Please upload them using the button above.</p>
            ) : (
              requestDetails.attachedBills.map((bill, index) => (
                <div key={index} className="bill-card">
                  <img
                    src={bill.isPending && bill.file ? URL.createObjectURL(bill.file) : bill.url}
                    alt={bill.name}
                    className="bill-preview-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x300/e0e0e0/555555?text=Preview+Not+Available`; }}
                  />
                  <div className="bill-info">
                    <p className="bill-name">{bill.name}</p>
                    <p className="bill-type">{bill.type}</p>
                  </div>
                  <div className="bill-overlay">
                    <button
                      onClick={() => openDocumentViewModal(bill)}
                      className="bill-view-button"
                      title="View Bill"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {!isReadOnly && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeAttachedBill(index); }}
                        className="bill-view-button text-red"
                        title="Remove Bill"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    {/* Only show download link if the bill is not pending and has a URL */}
                    {!bill.isPending && bill.url && (
                      <a
                        href={bill.url}
                        download={bill.name}
                        className="bill-view-button"
                        title="Download Bill"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* View Document Modal for attached bills */}
      <ViewDocumentModal
        isOpen={isDocumentModalOpen}
        onRequestClose={closeDocumentViewModal}
        fileUrl={selectedFileForModal?.isPending && selectedFileForModal?.file ? URL.createObjectURL(selectedFileForModal.file) : selectedFileForModal?.url}
        fileName={selectedFileForModal?.name}
        mimeType={selectedFileForModal?.type}
      />

      {/* Modal for displaying full BOT Remarks */}
      <TextDisplayModal
        isOpen={isBotRemarksModalOpen}
        onRequestOnClose={closeBotRemarksModal}
        title="Full BOT Remarks"
        textContent={selectedBotRemark}
      />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default ReimbursementForm;
