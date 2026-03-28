/**
 * @fileoverview Safe Asset URL Resolver
 * 
 * Ensures that all upload URLs (especially older ones from dev databases)
 * correctly point to the active backend URL context, regardless of where they
 * were originally uploaded or whether they arrive via REST or WebSockets.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.flowkyn.com/v1';

export function getSafeImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  // If it's an absolute URL pointing to /uploads/ (e.g., http://localhost:3000/uploads/...)
  const match = url.match(/^https?:\/\/[^\/]+(\/uploads\/.*)/);
  if (match) {
    const baseRoot = API_BASE.replace(/\/v1$/, '');
    return `${baseRoot}${match[1]}`;
  }
  
  // If it's a relative URL
  if (url.startsWith('/uploads/')) {
    const baseRoot = API_BASE.replace(/\/v1$/, '');
    return `${baseRoot}${url}`;
  }
  
  return url;
}
