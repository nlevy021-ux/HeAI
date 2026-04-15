import { cn } from '@/lib/utils';

export function Slider({ value = [0], min = 0, max = 100, step = 1, onValueChange, className }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0] ?? min}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      className={cn('w-full accent-primary', className)}
    />
  );
}
