import client from './client';

/**
 * Execute AI-powered hybrid legal search fusing vector embeddings, section overlaps, and keyword matching.
 *
 * @param {string|Object} queryOrOptions - Natural language query string or options object { query, filters, limit, offset }
 * @param {Object} [filters={}] - Optional filters { court, year_from, year_to, outcome, act }
 * @param {number} [limit=20] - Page size
 * @param {number} [offset=0] - Offset index for pagination
 * @returns {Promise<Object>} Search results containing { total, results, query_understanding }
 */
export async function searchCases(queryOrOptions, filters = {}, limit = 20, offset = 0) {
  let payload;

  if (typeof queryOrOptions === 'object' && queryOrOptions !== null && 'query' in queryOrOptions) {
    payload = {
      query: queryOrOptions.query,
      filters: queryOrOptions.filters || {},
      limit: queryOrOptions.limit !== undefined ? queryOrOptions.limit : 20,
      offset: queryOrOptions.offset !== undefined ? queryOrOptions.offset : 0,
    };
  } else {
    payload = {
      query: queryOrOptions,
      filters,
      limit,
      offset,
    };
  }

  const response = await client.post('/search/', payload);
  return response.data;
}

export default {
  searchCases,
};
