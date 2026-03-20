import type * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type GameActionButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

export interface GameActionButtonProps extends Omit<ButtonProps, 'size'> {
  size?: GameActionButtonSize;
}

/**
 * Small shared wrapper to keep action buttons consistent across games.
 * - Standardizes rounded corners for a unified feel.
 * - Maps semantic sizes to the shared `Button` component sizes.
 * - Relies on `Button`'s built-in `[&_svg]:size-4` + gap styling for icon consistency.
 */
export function GameActionButton({
  size = 'lg',
  className,
  variant,
  ...props
}: GameActionButtonProps) {
  const mappedSize: ButtonProps['size'] =
    size === 'md'
      ? 'default'
      : size === 'icon'
        ? 'icon'
        : size;

  return (
    <Button
      {...props}
      variant={variant}
      size={mappedSize}
      className={cn('rounded-xl', className)}
    />
  );
}

