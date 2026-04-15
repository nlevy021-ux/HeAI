import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Checkbox({ checked = false, onCheckedChange, className, id, ...props }) {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'h-5 w-5 rounded border border-input bg-background flex items-center justify-center',
        checked ? 'bg-primary text-primary-foreground border-primary' : '',
        className
      )}
      {...props}
    >
      {checked ? <Check className="h-3.5 w-3.5" /> : null}
    </button>
  );
}
