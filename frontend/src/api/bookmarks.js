import client from './client';

/**
 * Retrieve all saved bookmarks for the authenticated user.
 *
 * @returns {Promise<Array>} List of bookmark objects
 */
export async function getBookmarks() {
  const response = await client.get('/bookmarks/');
  return response.data;
}

/**
 * Bookmark a specific case record.
 *
 * @param {string|Object} caseIdOrPayload - Case ID or payload object { case_id }
 * @returns {Promise<Object>} Created bookmark response
 */
export async function addBookmark(caseIdOrPayload) {
  const caseId =
    typeof caseIdOrPayload === 'object' && caseIdOrPayload !== null
      ? caseIdOrPayload.case_id || caseIdOrPayload.caseId
      : caseIdOrPayload;

  const response = await client.post('/bookmarks/', { case_id: caseId });
  return response.data;
}

/**
 * Remove a bookmarked case by its bookmark ID.
 *
 * @param {string|number} bookmarkId - ID of bookmark entry to delete
 * @returns {Promise<Object>} Deletion result
 */
export async function removeBookmark(bookmarkId) {
  const response = await client.delete(`/bookmarks/${bookmarkId}`);
  return response.data;
}

export default {
  getBookmarks,
  addBookmark,
  removeBookmark,
};
