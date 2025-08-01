// src/controllers/reimbursementController.js
import { readData, writeData } from '../utils/fileHandler.js';
import { USER_ROLES, REIMBURSEMENT_STATUSES } from '../utils/config.js'; // Ensure REIMBURSEMENT_STATUSES is imported

const filePath = './data/reimbursements_detailed.json';

// Helper to check if a string is a valid date (YYYY-MM-DD)
const isValidDate = (dateString) => {
    return dateString && !isNaN(new Date(dateString));
};

// Controller for Requester Reports (existing)
export const getRequesterReports = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        let allReports = await readData(filePath);

        let filteredReports = [...allReports];

        if (userRole === USER_ROLES.REQUESTER) {
            filteredReports = filteredReports.filter(report => String(report.requesterId) === String(userId));
        }

        const { status, billType, fromDate, toDate, globalSearch } = req.query;

        if (status && status !== 'All') {
            filteredReports = filteredReports.filter(report => report.status === status);
        }
        if (billType && billType !== 'All') {
            filteredReports = filteredReports.filter(report =>
                report.lineItems.some(item => item.billType === billType)
            );
        }

        if (fromDate && isValidDate(fromDate)) {
            const from = new Date(fromDate);
            filteredReports = filteredReports.filter(report => new Date(report.requestDate) >= from);
        }
        if (toDate && isValidDate(toDate)) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            filteredReports = filteredReports.filter(report => new Date(report.requestDate) <= to);
        }

        if (globalSearch) {
            const query = globalSearch.toLowerCase();
            filteredReports = filteredReports.filter(report =>
                Object.values(report).some(value =>
                    String(value).toLowerCase().includes(query)
                ) ||
                report.attachedBills.some(bill => String(bill.name).toLowerCase().includes(query)) ||
                report.lineItems.some(item =>
                    String(item.billNo).toLowerCase().includes(query) ||
                    String(item.vendor).toLowerCase().includes(query) ||
                    String(item.requesterComments).toLowerCase().includes(query) ||
                    String(item.amount).includes(query)
                )
            );
        }

        const formattedReports = filteredReports.map(report => ({
            id: report.id,
            date: report.requestDate,
            amount: report.lineItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0),
            approver: report.approver || 'N/A',
            status: report.status,
            billType: report.lineItems.length > 0 ? report.lineItems[0].billType : 'Miscellaneous',
            filePath: report.attachedBills?.[0]?.url,
            fileName: report.attachedBills?.[0]?.name,
            mimeType: report.attachedBills?.[0]?.type,
        }));

        res.status(200).json(formattedReports);
    } catch (error) {
        console.error('Error fetching requester reports:', error);
        res.status(500).json({ message: 'Server error while fetching reports.', error: error.message });
    }
};

// Get Summary Data for Requester Dashboard (existing)
export const getSummaryForRequester = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required for summary data.' });
        }

        const data = await readData(filePath);
        const userRequests = data.filter(item => String(item.requesterId) === String(userId));

        const summary = {
            pendingApproval: userRequests.filter(req => req.status === REIMBURSEMENT_STATUSES.WAITING_APPROVAL).length,
            approved: userRequests.filter(req =>
                req.status === REIMBURSEMENT_STATUSES.STAGE_1_APPROVED ||
                req.status === REIMBURSEMENT_STATUSES.STAGE_2_APPROVED ||
                req.status === REIMBURSEMENT_STATUSES.PROCESSED
            ).length,
            rejected: userRequests.filter(req =>
                req.status === REIMBURSEMENT_STATUSES.STAGE_1_REJECTED ||
                req.status === REIMBURSEMENT_STATUSES.STAGE_2_REJECTED ||
                req.status === REIMBURSEMENT_STATUSES.ERROR
            ).length,
            draft: userRequests.filter(req => req.status === 'Draft').length,
        };

        res.json(summary);
    } catch (error) {
        console.error('Error getting requester summary:', error);
        res.status(500).json({ message: 'Error fetching requester summary.' });
    }
};

// Get Recent Activity for Requester Dashboard (existing)
export const getRecentActivityForRequester = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required for recent activity.' });
        }

        const data = await readData(filePath);
        const userRecentActivity = data
            .filter(item => String(item.requesterId) === String(userId))
            .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))
            .slice(0, 5)
            .map(item => ({
                id: item.id,
                date: item.requestDate,
                amount: parseFloat(item.lineItems.reduce((sum, lineItem) => sum + parseFloat(lineItem.amount || 0), 0)),
                status: item.status,
                requester: item.requesterName || 'You',
                filePath: item.attachedBills?.[0]?.url || '',
                fileName: item.attachedBills?.[0]?.name || '',
                mimeType: item.attachedBills?.[0]?.type || '',
            }));

        res.json(userRecentActivity);
    } catch (error) {
        console.error('Error getting recent activity:', error);
        res.status(500).json({ message: 'Error fetching recent activity.' });
    }
};

// NEW Controller: Get Summary Data for Approver Dashboard
export const getSummaryForApprover = async (req, res) => {
    try {
        const userRole = req.headers['x-user-role'];
        const approverName = req.headers['x-user-name'];

        console.log(`[getSummaryForApprover] Received userRole: ${userRole}, approverName: '${approverName}'`); // Debug log

        // Allow ADMIN to proceed without approverName, but require role check
        if (userRole === USER_ROLES.ADMIN) {
            // Admins can view the summary without a specific approverName
        } else if (userRole === USER_ROLES.APPROVER) {
            // Approvers must have a name to filter by
            if (!approverName) {
                console.log('[getSummaryForApprover] Access Denied: Approver name is missing for APPROVER role.'); // Debug log
                return res.status(403).json({ message: 'Access Denied: Approver name is required for approver role.' });
            }
        } else {
            // Any other role is forbidden
            console.log(`[getSummaryForApprover] Access Denied: Insufficient role '${userRole}'.`); // Debug log
            return res.status(403).json({ message: 'Access Denied: Insufficient role for this summary.' });
        }

        const data = await readData(filePath);

        const relevantRequests = data.filter(req => {
            if (userRole === USER_ROLES.ADMIN) {
                return true; // Admins see all requests
            }
            // Approvers see requests where their name is included in the 'approver' field
            return String(req.approver || '').toLowerCase().includes(String(approverName || '').toLowerCase());
        });

        const pendingMyApproval = relevantRequests.filter(req => req.status === REIMBURSEMENT_STATUSES.WAITING_APPROVAL).length;
        const approvedByMe = relevantRequests.filter(req =>
            req.status === REIMBURSEMENT_STATUSES.STAGE_1_APPROVED ||
            req.status === REIMBURSEMENT_STATUSES.STAGE_2_APPROVED ||
            req.status === REIMBURSEMENT_STATUSES.PROCESSED
        ).length;
        const rejectedByMe = relevantRequests.filter(req =>
            req.status === REIMBURSEMENT_STATUSES.STAGE_1_REJECTED ||
            req.status === REIMBURSEMENT_STATUSES.STAGE_2_REJECTED ||
            req.status === REIMBURSEMENT_STATUSES.ERROR
        ).length;

        const totalRequestsReviewed = approvedByMe + rejectedByMe;
        const totalAmountToApprove = relevantRequests
            .filter(req => req.status === REIMBURSEMENT_STATUSES.WAITING_APPROVAL)
            .reduce((sum, req) => sum + parseFloat(req.lineItems.reduce((lineSum, item) => lineSum + parseFloat(item.amount || 0), 0) || 0), 0);

        res.json({
            pendingMyApproval,
            approvedByMe,
            rejectedByMe,
            totalRequestsReviewed,
            totalAmountToApprove
        });

    } catch (error) {
        console.error('Error getting approver summary:', error);
        res.status(500).json({ message: 'Error fetching approver summary.' });
    }
};

// NEW Controller: Get Pending Requests for Approver Dashboard
export const getPendingRequestsForApprover = async (req, res) => {
    try {
        const userRole = req.headers['x-user-role'];
        const approverName = req.headers['x-user-name'];

        console.log(`[getPendingRequestsForApprover] Received userRole: ${userRole}, approverName: '${approverName}'`); // Debug log

        // Allow ADMIN to proceed without approverName, but require role check
        if (userRole === USER_ROLES.ADMIN) {
            // Admins can view pending requests without a specific approverName
        } else if (userRole === USER_ROLES.APPROVER) {
            // Approvers must have a name to filter by
            if (!approverName) {
                console.log('[getPendingRequestsForApprover] Access Denied: Approver name is missing for APPROVER role.'); // Debug log
                return res.status(403).json({ message: 'Access Denied: Approver name is required for approver role.' });
            }
        } else {
            // Any other role is forbidden
            console.log(`[getPendingRequestsForApprover] Access Denied: Insufficient role '${userRole}'.`); // Debug log
            return res.status(403).json({ message: 'Access Denied: Insufficient role for this view.' });
        }

        const data = await readData(filePath);

        const pendingRequests = data
            .filter(req =>
                req.status === REIMBURSEMENT_STATUSES.WAITING_APPROVAL &&
                (userRole === USER_ROLES.ADMIN || String(req.approver || '').toLowerCase().includes(String(approverName || '').toLowerCase()))
            )
            .sort((a, b) => new Date(a.requestDate) - new Date(b.requestDate))
            .map(item => ({
                id: item.id,
                requestDate: item.requestDate,
                requesterName: item.requesterName || 'N/A',
                approver: item.approver || 'N/A',
                status: item.status,
                totalAmount: parseFloat(item.lineItems.reduce((sum, lineItem) => sum + parseFloat(lineItem.amount || 0), 0)),
            }));

        res.json(pendingRequests);

    } catch (error) {
        console.error('Error getting pending requests for approver:', error);
        res.status(500).json({ message: 'Error fetching pending requests for approver.' });
    }
};


// Get all reimbursement requests (existing)
export const getAllReimbursements = async (req, res) => {
  try {
    const data = await readData(filePath);
    res.json(data);
  } catch (error) {
    console.error('Error getting all reimbursements:', error);
    res.status(500).json({ message: 'Error fetching reimbursements' });
  }
};

// Get a single reimbursement request by ID (existing)
export const getReimbursementById = async (req, res) => {
  try {
    const id = req.params.id; // ID can be string or number, keep it flexible
    const data = await readData(filePath);
    // Find by string ID or numeric ID
    const reimbursement = data.find(item => String(item.id) === String(id));

    if (!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement request not found' });
    }
    res.json(reimbursement);
  } catch (error) {
    console.error('Error getting reimbursement by ID:', error);
    res.status(500).json({ message: 'Error fetching reimbursement' });
  }
};

// Add a new reimbursement request (existing)
export const addReimbursement = async (req, res) => {
  try {
    const userId = req.headers['x-user-id']; // Assuming userId is passed in headers for this simplified auth

    const newReimbursement = {
      id: `REQ${Date.now()}`, // Generate a unique ID for the request
      requestDate: new Date().toISOString().split('T')[0], // Current date
      requesterId: userId, // Link to the user who created it
      requesterName: req.body.requesterName || 'Default Requester', // Assuming requester name comes from frontend
      overallComments: req.body.overallComments || '',
      approver: req.body.approver || '',
      attachedBills: req.body.attachedBills || [], // Array of { name, url, type }
      lineItems: req.body.lineItems || [], // Array of line item objects
      approverComments: '',
      botRemarks: 'Overall: Initial check pending.',
      status: REIMBURSEMENT_STATUSES.WAITING_APPROVAL, // Set initial status as requested
      stage: 'NEW', // Set initial stage as requested
      ...req.body // Allow other fields from the body to be included
    };

    const data = await readData(filePath);
    data.push(newReimbursement);
    await writeData(filePath, data);
    res.status(201).json(newReimbursement);
  } catch (error) {
    console.error('Error adding reimbursement:', error);
    res.status(500).json({ message: 'Error adding reimbursement' });
  }
};

// Update an existing reimbursement request (existing)
export const updateReimbursement = async (req, res) => {
  try {
    const id = req.params.id; // ID can be string or number
    const updatedFields = req.body; // Contains partial updates

    const data = await readData(filePath);
    const index = data.findIndex(item => String(item.id) === String(id));

    if (index === -1) {
      return res.status(404).json({ message: 'Reimbursement request not found' });
    }

    // Merge existing data with updated fields
    data[index] = { ...data[index], ...updatedFields, id: data[index].id }; // Ensure ID remains unchanged

    await writeData(filePath, data);
    res.json(data[index]);
  } catch (error) {
    console.error('Error updating reimbursement:', error);
    res.status(500).json({ message: 'Error updating reimbursement' });
  }
};

// Delete a reimbursement request (existing)
export const deleteReimbursement = async (req, res) => {
  try {
    const id = req.params.id; // ID can be string or number
    const data = await readData(filePath);
    const newData = data.filter(item => String(item.id) !== String(id));

    if (newData.length === data.length) {
      return res.status(404).json({ message: 'Reimbursement request not found' });
    }

    await writeData(filePath, newData);
    res.json({ message: 'Reimbursement request deleted successfully' });
  } catch (error) {
    console.error('Error deleting reimbursement:', error);
    res.status(500).json({ message: 'Error deleting reimbursement' });
  }
};
