import React from 'react';
import { cn } from '../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
}

export const GlassButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  ...props 
}: GlassButtonProps) => {
  
  const variants = {
    primary: "bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_10px_rgba(249,115,22,0.3)] border-none hover:brightness-110",
    secondary: "bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_10px_rgba(59,130,246,0.3)] border-none hover:brightness-110",
    ghost: "bg-white/30 text-gray-700 border border-white/50 hover:bg-white/50 shadow-sm backdrop-blur-md",
    icon: "bg-white/20 text-gray-700 border border-white/40 hover:bg-white/40 shadow-sm backdrop-blur-md flex items-center justify-center rounded-full aspect-square p-0",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-sm rounded-full",
    md: "px-6 py-2.5 text-base rounded-full",
    lg: "px-8 py-3.5 text-lg rounded-full",
    icon: "w-10 h-10 rounded-full",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative font-medium transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400/50",
        variants[variant],
        variant === 'icon' ? sizes.icon : sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};
