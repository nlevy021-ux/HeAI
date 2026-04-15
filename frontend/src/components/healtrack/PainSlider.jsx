import { Slider } from '@/components/ui/slider';

const PAIN_LABELS = ['None', '', 'Mild', '', 'Moderate', '', 'Severe', '', 'Very Severe', '', 'Worst'];

export default function PainSlider({ value, onChange }) {
  const painColor = value <= 3 ? 'text-success' : value <= 6 ? 'text-warning' : 'text-danger';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Pain Level
        </span>
        <span className={`text-2xl font-heading font-bold ${painColor}`}>
          {value}
        </span>
      </div>

      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={10}
        step={1}
        className="py-2"
      />

      <div className="flex justify-between">
        <span className="text-[10px] text-muted-foreground">No pain</span>
        <span className="text-[10px] text-muted-foreground">Worst pain</span>
      </div>

      {PAIN_LABELS[value] && (
        <div className={`text-center text-sm font-semibold ${painColor}`}>
          {PAIN_LABELS[value]}
        </div>
      )}
    </div>
  );
}