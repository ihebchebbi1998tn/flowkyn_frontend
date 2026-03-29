import { useState, useEffect, useCallback } from 'react';

/**
 * useWinsFeed Hook
 * 
 * Manages Wins of Week feed state:
 * - Detects new posts
 * - Tracks milestone achievements
 * - Provides UI feedback mechanisms
 * 
 * @param postsCount - Current number of posts in feed
 * @returns Object with newPostsCount, markPostsAsSeen, hasMilestone, clearMilestone
 */
export function useWinsFeed(postsCount: number) {
  const [lastSeenPostCount, setLastSeenPostCount] = useState(postsCount);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [currentMilestone, setCurrentMilestone] = useState<number | null>(null);

  // Milestones to celebrate
  const MILESTONES = [5, 10, 25, 50, 100];

  /**
   * Detect new posts when posts count changes
   */
  useEffect(() => {
    const diff = postsCount - lastSeenPostCount;
    if (diff > 0) {
      setNewPostsCount(diff);

      // Check if we've reached a milestone
      for (const milestone of MILESTONES) {
        if (postsCount === milestone && currentMilestone !== milestone) {
          setCurrentMilestone(milestone);
          // Milestone will auto-clear after 3 seconds
          const timer = setTimeout(() => setCurrentMilestone(null), 3000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [postsCount, lastSeenPostCount, currentMilestone]);

  /**
   * Mark new posts as seen (typically called when user scrolls to top)
   */
  const markPostsAsSeen = useCallback(() => {
    setLastSeenPostCount(postsCount);
    setNewPostsCount(0);
  }, [postsCount]);

  /**
   * Clear milestone notification
   */
  const clearMilestone = useCallback(() => {
    setCurrentMilestone(null);
  }, []);

  return {
    newPostsCount,
    markPostsAsSeen,
    hasMilestone: currentMilestone !== null,
    currentMilestone,
    clearMilestone,
  };
}
