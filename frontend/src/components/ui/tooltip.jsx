import { cn } from '@/lib/utils';

export function TooltipProvider({ children }) {
  return children;
}

export function Tooltip({ children }) {
  return <span className="relative inline-flex items-center">{children}</span>;
}

export function TooltipTrigger({ children, className }) {
  return <span className={cn('inline-flex', className)}>{children}</span>;
}

export function TooltipContent({ children, className }) {
  return (
    <span
      className={cn(
        'absolute left-0 top-full z-20 mt-1 hidden w-56 rounded-md border border-border bg-card p-2 text-xs shadow-sm md:group-hover:block',
        className
      )}
    >
      {children}
    </span>
  );
}
