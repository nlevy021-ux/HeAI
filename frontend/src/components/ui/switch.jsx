import { cn } from '@/lib/utils';

export function Switch({ checked = false, onCheckedChange, className, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'inline-flex h-6 w-11 items-center rounded-full border transition-colors',
        checked ? 'bg-primary border-primary' : 'bg-muted border-border',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}
