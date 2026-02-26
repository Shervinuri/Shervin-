import React from 'react';
import { cn } from '../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className, ...props }: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/40 bg-white/20 p-6 shadow-xl backdrop-blur-xl",
        "before:absolute before:inset-0 before:z-[-1] before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
