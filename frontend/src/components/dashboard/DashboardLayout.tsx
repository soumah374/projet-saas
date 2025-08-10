import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6",
      "auto-rows-min",
      className
    )}>
      {children}
    </div>
  );
}; 