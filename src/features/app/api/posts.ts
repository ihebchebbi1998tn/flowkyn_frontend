/**
 * @fileoverview Posts API Module
 *
 * Post reactions — allows participants to react to activity posts.
 * Post creation is handled via eventsApi.createPost().
 *
 * @see NodejsBackend/src/routes/events.routes.ts (postsRouter)
 */

import { api } from './client';

export const postsApi = {
  /**
   * React to an activity post.
   * Participant ownership is verified server-side to prevent impersonation.
   */
  react: (postId: string, participantId: string, reactionType: string) =>
    api.post(`/posts/${postId}/reactions`, { participant_id: participantId, reaction_type: reactionType }),
};
