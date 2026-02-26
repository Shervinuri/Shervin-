import React from 'react';
import { cn } from '../lib/utils';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  className?: string;
  placeholder?: string;
}

export const GlassInput = ({ icon, className, ...props }: GlassInputProps) => {
  return (
    <div className="relative group">
      <div className={cn(
        "flex items-center w-full rounded-full border border-white/40 bg-white/30 px-4 py-3 shadow-inner backdrop-blur-md transition-all focus-within:bg-white/50 focus-within:shadow-md focus-within:border-white/60",
        className
      )}>
        {icon && <span className="mr-3 text-gray-500">{icon}</span>}
        <input
          className="w-full bg-transparent text-gray-800 placeholder-gray-500 outline-none"
          {...props}
        />
      </div>
    </div>
  );
};
