import { useState } from 'react';
import { HelpCircle, Pill, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const CLOSURE_METHODS = [
  { id: 'stitches', label: 'Stitches', icon: '🪡' },
  { id: 'staples', label: 'Staples', icon: '📎' },
  { id: 'steri_strips', label: 'Steri-Strips', icon: '🩹' },
  { id: 'medical_glue', label: 'Medical Glue', icon: '💧' },
];

const FREQUENCIES = [
  { id: 'daily', label: 'Daily' },
  { id: 'every_2_days', label: 'Every 2 Days' },
  { id: 'as_needed', label: 'As Needed' },
];

export default function StepCalibration({ data, setData }) {
  const [showHelp, setShowHelp] = useState(false);
  const closureMethods = data.closure_methods || [];

  const toggleClosure = (id) => {
    const updated = closureMethods.includes(id)
      ? closureMethods.filter(m => m !== id)
      : [...closureMethods, id];
    setData(d => ({ ...d, closure_methods: updated }));
  };

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
        Calibration
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Help us understand your wound for better tracking.
      </p>

      {/* Section 1: Wound Closure */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Wound Closure Method
          </h3>
          <HelpCircle
            className="w-3.5 h-3.5 text-muted-foreground"
            title="Select how your wound was closed after surgery. This helps analysis quality."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CLOSURE_METHODS.map(method => {
            const selected = closureMethods.includes(method.id);
            return (
              <button
                key={method.id}
                onClick={() => toggleClosure(method.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  selected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <span className="text-2xl">{method.icon}</span>
                <span className={`text-xs font-semibold ${selected ? 'text-primary' : 'text-muted-foreground'}`}>
                  {method.label}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="mt-2 text-xs text-primary font-medium underline underline-offset-2"
        >
          Not sure? See examples
        </button>
        {showHelp && (
          <div className="mt-2 p-3 bg-accent rounded-xl text-xs text-muted-foreground">
            <p><strong>Stitches:</strong> Thread-like material sewn through skin</p>
            <p><strong>Staples:</strong> Small metal clips along the incision</p>
            <p><strong>Steri-Strips:</strong> Thin adhesive strips across the wound</p>
            <p><strong>Medical Glue:</strong> Clear adhesive applied over the wound</p>
          </div>
        )}
      </div>

      {/* Section 2: Medications */}
      <div className="mb-6 p-4 bg-card rounded-2xl border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Pill className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Medications & Constraints
          </h3>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-foreground">Taking antibiotics or blood thinners?</span>
          <Switch
            checked={data.taking_medications || false}
            onCheckedChange={v => setData(d => ({ ...d, taking_medications: v }))}
          />
        </div>
        {data.taking_medications && (
          <Input
            value={data.medications_list || ''}
            placeholder="List your medications..."
            onChange={e => setData(d => ({ ...d, medications_list: e.target.value }))}
            className="h-12 rounded-xl text-sm"
          />
        )}
      </div>

      {/* Section 3: Frequency */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Check-in Frequency
          </h3>
        </div>
        <div className="flex gap-2">
          {FREQUENCIES.map(f => {
            const selected = data.checkin_frequency === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setData(d => ({ ...d, checkin_frequency: f.id }))}
                className={`flex-1 py-3 px-3 rounded-2xl text-xs font-semibold transition-all ${
                  selected
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}