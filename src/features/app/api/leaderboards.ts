/**
 * @fileoverview Leaderboards API Module
 *
 * Fetches leaderboard data and individual entries.
 * Leaderboards are automatically populated when game sessions finish.
 *
 * @see NodejsBackend/src/routes/leaderboards.routes.ts
 */

import { api } from './client';

export const leaderboardsApi = {
  /** Get leaderboard metadata by ID */
  getById: (id: string) =>
    api.get(`/leaderboards/${id}`),

  /** Get ranked entries for a leaderboard */
  getEntries: (id: string) =>
    api.get(`/leaderboards/${id}/entries`),
};
