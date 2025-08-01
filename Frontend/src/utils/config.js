// src/utils/constants.js

export const USER_ROLES = {
  REQUESTER: 'requester',
  APPROVER: 'approver',
  ADMIN: 'admin',
  TENANT: 'tenant', // Assuming tenant is a high-level role, adjust as needed
  CLERK: 'clerk',   // Assuming clerk is another role, adjust as needed
};

export const REIMBURSEMENT_STATUSES = {
  DRAFT: 'Draft',
  WAITING_APPROVAL: 'Waiting Approval',
  STAGE_1_APPROVED: 'Stage 1 Approved',
  STAGE_1_REJECTED: 'Stage 1 Rejected',
  STAGE_2_APPROVED: 'Stage 2 Approved',
  STAGE_2_REJECTED: 'Stage 2 Rejected',
  PROCESSED: 'Processed',
  ERROR: 'Error',
};

export const REIMBURSEMENT_STAGES = {
  DRAFTING: 'Drafting',
  REVIEW: 'Review',
  APPROVAL_STAGE_1: 'Approval Stage 1',
  APPROVAL_STAGE_2: 'Approval Stage 2',
  ACCOUNT: 'Account Processing',
  COMPLETED: 'Completed',
};

export const BILL_TYPES = [
  'Travel',
  'Food',
  'Office Supplies',
  'Software',
  'Utilities',
  'Training',
  'Miscellaneous',
];

// Base URL for your API (json-server in this case)
export const API_BASE_URL = 'http://localhost:3001';