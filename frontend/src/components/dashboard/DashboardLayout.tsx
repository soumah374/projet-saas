import React from 'react';
import { cn } from '@/lib/utils';

export const DashboardLayout: React.FC<{ children: React.ReactNode; header?: React.ReactNode }> = ({ children, header }) => {
  return (
    <div className="space-y-6">
      {header}
      <div className="grid grid-cols-1 gap-6">
        {children}
      </div>
    </div>
  );
}; 