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
   * Pass eventId when caller is a guest so the API client can use guest_token_${eventId}.
   */
  react: (postId: string, participantId: string, reactionType: string, eventId?: string) =>
    api.post(`/posts/${postId}/reactions`, { participant_id: participantId, reaction_type: reactionType }, eventId),
};
