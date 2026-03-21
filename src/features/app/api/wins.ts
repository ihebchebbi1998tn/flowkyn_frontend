/**
 * @fileoverview Wins API Module
 *
 * Manages win categories and tags for organizing achievements.
 * Provides endpoints for category management, tagging, and filtering.
 */

import { api } from './client';

export interface WinCategory {
  id: string;
  organization_id: string;
  key: string;
  label: string;
  description?: string;
  color?: string;
  icon?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostTag {
  post_id: string;
  tag: string;
  created_at: string;
  created_by_member_id?: string;
}

export const winsApi = {
  /**
   * Get all categories for an organization
   */
  getCategories: (organizationId: string) =>
    api.get<WinCategory[]>(`/organizations/${organizationId}/wins/categories`),

  /**
   * Create a new category
   */
  createCategory: (organizationId: string, data: {
    key: string;
    label: string;
    description?: string;
    color?: string;
    icon?: string;
  }) =>
    api.post<WinCategory>(`/organizations/${organizationId}/wins/categories`, data),

  /**
   * Update a category
   */
  updateCategory: (categoryId: string, data: Partial<WinCategory>) =>
    api.put<WinCategory>(`/wins/categories/${categoryId}`, data),

  /**
   * Delete a category
   */
  deleteCategory: (categoryId: string) =>
    api.del<void>(`/wins/categories/${categoryId}`),

  /**
   * Add tags to a post
   */
  addTags: (postId: string, tags: string[]) =>
    api.post<PostTag[]>(`/posts/${postId}/tags`, { tags }),

  /**
   * Remove tags from a post
   */
  removeTags: (postId: string, tags: string[]) =>
    api.del<void>(`/posts/${postId}/tags`),

  /**
   * Get all tags for a post
   */
  getTags: (postId: string) =>
    api.get<string[]>(`/posts/${postId}/tags`),

  /**
   * Get all unique tags in an organization
   */
  getAllTags: (organizationId: string) =>
    api.get<string[]>(`/organizations/${organizationId}/wins/tags`),

  /**
   * Get posts by category
   */
  getPostsByCategory: (organizationId: string, category: string, limit?: number, offset?: number) =>
    api.get(`/organizations/${organizationId}/wins/posts/category/${category}`, {
      limit: limit?.toString(),
      offset: offset?.toString(),
    }),

  /**
   * Get posts by tag
   */
  getPostsByTag: (organizationId: string, tag: string, limit?: number, offset?: number) =>
    api.get(`/organizations/${organizationId}/wins/posts/tag/${tag}`, {
      limit: limit?.toString(),
      offset: offset?.toString(),
    }),

  /**
   * Set category for a post
   */
  setPostCategory: (postId: string, category: string) =>
    api.put(`/posts/${postId}/category`, { category }),
};

export default winsApi;
