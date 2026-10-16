import client from './client';

/**
 * Run AI gap analysis on petition draft text to identify missing arguments and grounded case citations.
 *
 * @param {string|Object} petitionTextOrPayload - Draft text string or payload object
 * @param {string} [sessionId=null] - Optional working draft session ID
 * @param {string} [title] - Optional title for the draft
 * @returns {Promise<Object>} Analysis results { identified_grounds, missing_arguments, suggested_sections, citation_suggestions }
 */
export async function analyzeDraft(petitionTextOrPayload, sessionId = null, title = undefined) {
  let payload;

  if (typeof petitionTextOrPayload === 'object' && petitionTextOrPayload !== null) {
    payload = {
      petition_text: petitionTextOrPayload.petition_text ?? petitionTextOrPayload.petitionText,
      session_id: petitionTextOrPayload.session_id ?? petitionTextOrPayload.sessionId ?? null,
      title: petitionTextOrPayload.title ?? undefined,
    };
  } else {
    payload = {
      petition_text: petitionTextOrPayload,
      session_id: sessionId ?? null,
      title: title ?? undefined,
    };
  }

  const response = await client.post('/draft/analyze', payload);
  return response.data;
}

/**
 * Save or initialize a new draft working session.
 *
 * @param {Object} data - Draft session payload { title, draft_text }
 * @returns {Promise<Object>} Created session response
 */
export async function createSession(data) {
  const response = await client.post('/draft/sessions', data);
  return response.data;
}

/**
 * Retrieve all saved draft sessions for the authenticated advocate/scholar.
 *
 * @returns {Promise<Array>} List of draft session records
 */
export async function getSessions() {
  const response = await client.get('/draft/sessions');
  return response.data;
}

/**
 * Compare draft petition against specific landmark precedent using 3-layer precision comparison.
 *
 * @param {string} draftText - The draft petition text
 * @param {string} caseId - The target precedent case ID
 * @returns {Promise<Object>} 3-layer precedent comparison result
 */
export async function compareWithPrecedent(draftText, caseId) {
  const response = await client.post('/draft/compare-with-precedent', {
    draft_text: draftText,
    case_id: caseId,
  });
  return response.data;
}

export default {
  analyzeDraft,
  createSession,
  getSessions,
  compareWithPrecedent,
};
