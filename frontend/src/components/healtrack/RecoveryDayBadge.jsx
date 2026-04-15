import { differenceInDays, parseISO } from 'date-fns';

export default function RecoveryDayBadge({ surgeryDate }) {
  if (!surgeryDate) return null;
  const days = differenceInDays(new Date(), parseISO(surgeryDate));
  
  return (
    <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
      <span className="text-xs font-medium">Day</span>
      <span className="text-lg font-heading font-bold">{Math.max(0, days)}</span>
      <span className="text-xs font-medium">of Recovery</span>
    </div>
  );
}