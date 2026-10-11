import client from './client';

/**
 * Retrieve pending case uploads awaiting administrative review.
 *
 * @returns {Promise<Array>} List of pending approval queue items
 */
export async function getApprovalQueue() {
  const response = await client.get('/admin/queue');
  return response.data;
}

/**
 * Approve or reject a submitted judgment record.
 *
 * @param {string} caseId - Case identifier to review
 * @param {string|Object} statusOrPayload - Status string ('published'|'rejected') or payload object
 * @param {string} [reviewNote=''] - Administrative rationale or remarks
 * @returns {Promise<Object>} Updated case record
 */
export async function approveCase(caseId, statusOrPayload, reviewNote = '') {
  let payload;

  if (typeof statusOrPayload === 'object' && statusOrPayload !== null) {
    payload = {
      status: statusOrPayload.status,
      review_note: statusOrPayload.review_note ?? statusOrPayload.reviewNote ?? '',
    };
  } else {
    payload = {
      status: statusOrPayload,
      review_note: reviewNote,
    };
  }

  const response = await client.post(`/admin/approve/${caseId}`, payload);
  return response.data;
}

/**
 * Fetch immutable audit logs with optional filter parameters and pagination.
 *
 * @param {Object} [params={}] - Query filters { action, case_id, user_id, skip, limit }
 * @returns {Promise<Array>} List of audit log records
 */
export async function getAuditLogs(params = {}) {
  const response = await client.get('/admin/audit-logs', { params });
  return response.data;
}

/**
 * Perform cryptographic audit chain verification by validating SHA-256 links between consecutive log entries.
 *
 * @returns {Promise<Object>} Verification status { is_valid, total_records, broken_at_id, message }
 */
export async function verifyAuditChain() {
  const response = await client.get('/admin/verify-audit-chain');
  return response.data;
}

/**
 * Retrieve administrative analytics including repository statistics and user breakdown.
 *
 * @returns {Promise<Object>} Analytics figures { cases, audit, users }
 */
export async function getAnalytics() {
  const response = await client.get('/admin/analytics');
  return response.data;
}

export default {
  getApprovalQueue,
  approveCase,
  getAuditLogs,
  verifyAuditChain,
  getAnalytics,
};
