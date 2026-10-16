import client from './client';

/**
 * Queries the Lexguard cryptographic registry using a 64-character SHA-256 hash.
 * Does not upload any local files.
 *
 * @param {string} sha256Hash - 64-character hexadecimal SHA-256 string
 * @returns {Promise<Object>} Verification lookup response { matched, case, message, hash_label, audit_label }
 */
export async function lookupHash(sha256Hash) {
  const cleanHash = (sha256Hash || '').trim().toLowerCase();
  const response = await client.get(`/verification/lookup/${cleanHash}`);
  return response.data;
}

/**
 * Returns the secure streaming URL for an authentic registered judgment document.
 *
 * @param {string} caseId - Registered case ID
 * @returns {string} Relative streaming URL
 */
export function getDocumentStreamUrl(caseId) {
  return `/api/v1/verification/documents/${caseId}/stream`;
}

export function streamJudgmentDocument(caseId) {
  return getDocumentStreamUrl(caseId);
}

export const verificationApi = {
  lookupHash,
  getDocumentStreamUrl,
  streamJudgmentDocument,
};

export default verificationApi;
