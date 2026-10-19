import client from './client';

/**
 * Upload a judicial judgment document with metadata for cryptographic ingestion.
 *
 * @param {FormData|Object} formData - FormData or metadata object containing file, title, court, year, etc.
 * @returns {Promise<Object>} Created case record response
 */
export async function uploadCase(formData) {
  let payload = formData;

  // Support plain object by converting into FormData if not already an instance
  if (!(formData instanceof FormData) && typeof formData === 'object' && formData !== null) {
    payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File || value instanceof Blob) {
          payload.append(key, value);
        } else if (Array.isArray(value) || typeof value === 'object') {
          payload.append(key, JSON.stringify(value));
        } else {
          payload.append(key, String(value));
        }
      }
    });
  }

  const response = await client.post('/cases/upload', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Fetch a list of cases filtered by parameters (court, year, status_filter, skip, limit).
 *
 * @param {Object} [params={}] - Query parameters { court, year, status_filter, skip, limit }
 * @returns {Promise<Array>} List of case records
 */
export async function getCases(params = {}) {
  const response = await client.get('/cases/', { params });
  return response.data;
}

/**
 * Retrieve metadata for a single case record by its ID.
 *
 * @param {string} caseId - Unique case identifier
 * @returns {Promise<Object>} Case metadata details
 */
export async function getCase(caseId) {
  const response = await client.get(`/cases/${caseId}`);
  return response.data;
}

/**
 * Retrieve complete case details and view judgment document with real-time SHA-256 integrity check.
 *
 * @param {string} caseId - Unique case identifier
 * @returns {Promise<Object>} Case document details including integrity badge and safe document path
 */
export async function viewCase(caseId) {
  const response = await client.get(`/cases/${caseId}/view`);
  return response.data;
}

/**
 * Execute real-time cryptographic audit on a judgment file to recalculate SHA-256 hash.
 *
 * @param {string} caseId - Unique case identifier
 * @returns {Promise<Object>} Verification status badge, expected hash, and computed hash
 */
export async function verifyIntegrity(caseId) {
  const response = await client.get(`/cases/${caseId}/verify-integrity`);
  return response.data;
}

/**
 * Retrieve page-by-page official judgment text extracted directly from official court PDF.
 *
 * @param {string} caseId - Unique case identifier
 * @returns {Promise<Object>} Official pages, full text, page count, word count, and source URL
 */
export async function getOfficialCaseContent(caseId) {
  const response = await client.get(`/cases/${caseId}/official-content`);
  return response.data;
}

/**
 * Precision in-document keyword search across the official judgment PDF.
 *
 * @param {string} caseId - Unique case identifier
 * @param {string} query - Keyword term or statutory section to locate
 * @returns {Promise<Object>} Occurrences with page numbers, line numbers, and highlighted snippets
 */
export async function searchKeywordsInCase(caseId, query) {
  const response = await client.get(`/cases/${caseId}/search-keywords`, {
    params: { q: query },
  });
  return response.data;
}

export default {
  uploadCase,
  getCases,
  getCase,
  viewCase,
  verifyIntegrity,
  getOfficialCaseContent,
  searchKeywordsInCase,
};

