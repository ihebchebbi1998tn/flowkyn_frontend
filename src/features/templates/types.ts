/**
 * @fileoverview Shared utilities and constants for the templates showcase.
 */

/** Section wrapper with anchor ID for navigation */
export interface SectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/** Navigation item for the sidebar */
export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
