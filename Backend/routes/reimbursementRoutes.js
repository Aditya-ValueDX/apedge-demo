// src/routes/reimbursementRoutes.js
import express from 'express';
import {
  getAllReimbursements,
  getReimbursementById,
  addReimbursement,
  updateReimbursement,
  deleteReimbursement,
  getRequesterReports,
  getSummaryForRequester,
  getRecentActivityForRequester,
  getSummaryForApprover, // Import the new approver summary controller
  getPendingRequestsForApprover // Import the new approver pending requests controller
} from '../controllers/reimbursementController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';
import { USER_ROLES } from '../utils/config.js';

const router = express.Router();

// Route for Requester Reports
router.get(
    '/reports/requester',
    authenticateToken,
    authorizeRole([USER_ROLES.REQUESTER, USER_ROLES.ADMIN, USER_ROLES.APPROVER]),
    getRequesterReports
);

// Get summary data for requester dashboard
router.get(
    '/summary/requester',
    authenticateToken,
    authorizeRole([USER_ROLES.REQUESTER, USER_ROLES.ADMIN, USER_ROLES.APPROVER]),
    getSummaryForRequester
);

// Get recent activity for requester dashboard
router.get(
    '/recent-activity/requester',
    authenticateToken,
    authorizeRole([USER_ROLES.REQUESTER, USER_ROLES.ADMIN, USER_ROLES.APPROVER]),
    getRecentActivityForRequester
);

// NEW Route: Get summary data for approver dashboard
router.get(
    '/summary/approver',
    authenticateToken,
    authorizeRole([USER_ROLES.APPROVER, USER_ROLES.ADMIN]), // Only approvers and admins
    getSummaryForApprover
);

// NEW Route: Get pending requests for approver dashboard
router.get(
    '/pending-requests/approver',
    authenticateToken,
    authorizeRole([USER_ROLES.APPROVER, USER_ROLES.ADMIN]), // Only approvers and admins
    getPendingRequestsForApprover
);

// Get all reimbursement requests
router.get('/', getAllReimbursements);
// Get a single reimbursement request by ID
router.get('/:id', getReimbursementById);
// Add a new reimbursement request
router.post('/', authenticateToken, addReimbursement);
// Update an existing reimbursement request
router.put('/:id', updateReimbursement);
// Delete a reimbursement request
router.delete('/:id', deleteReimbursement);

export default router;
