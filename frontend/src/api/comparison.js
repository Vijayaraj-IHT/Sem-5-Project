import client from './client';

/**
 * Compares a user's structured case dimensions against a published precedent.
 * Server evaluates explainable alignment without storing or retaining user case text.
 *
 * @param {Object} payload - Comparison payload { precedent_case_id, case_title, court_jurisdiction, facts_summary, legal_issues, statutory_provisions, remedy_sought, procedural_status, outcome }
 * @returns {Promise<Object>} Comparison result { overall_score, score_method, dimensions, precedent, disclaimer }
 */
export async function compareCase(payload) {
  const response = await client.post('/comparison/compare', payload);
  return response.data;
}

export async function compareCases(payload) {
  return compareCase(payload);
}

export async function getPublishedPrecedents(query = '') {
  const response = await client.get('/comparison/precedents', {
    params: { q: query || undefined },
  });
  return response.data;
}

export const comparisonApi = {
  compareCase,
  compareCases,
  getPublishedPrecedents,
};

export default comparisonApi;
