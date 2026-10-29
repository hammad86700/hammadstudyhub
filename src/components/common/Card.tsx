// ==============================================================================
// HAMMAD STUDYHUB — CARD CONTAINER
// ==============================================================================

import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  hover = false,
  bordered = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl bg-white dark:bg-navy-900/90 transition-all duration-200',
        bordered && 'border border-slate-200/90 dark:border-slate-800/80 shadow-subtle',
        hover && 'hover:shadow-card-hover hover:border-brand-300 dark:hover:border-brand-700/60 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
