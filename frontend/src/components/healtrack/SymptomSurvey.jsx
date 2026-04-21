import PainSlider from './PainSlider';
import { Thermometer, Info } from 'lucide-react';

function ToggleRow({ label, value, setValue, yesLabel = 'Yes', noLabel = 'No' }) {
  return (
    <div className="p-5 bg-card rounded-2xl border border-border mb-5">
      <p className="text-sm text-foreground mb-4">{label}</p>
      <div className="flex gap-3">
        <button
          onClick={() => setValue(true)}
          className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
            value ? 'bg-warning/15 text-warning border-2 border-warning/30' : 'bg-muted text-muted-foreground border-2 border-transparent'
          }`}
        >
          {yesLabel}
        </button>
        <button
          onClick={() => setValue(false)}
          className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
            !value ? 'bg-success/15 text-success border-2 border-success/30' : 'bg-muted text-muted-foreground border-2 border-transparent'
          }`}
        >
          {noLabel}
        </button>
      </div>
    </div>
  );
}

export default function SymptomSurvey({ pain, setPain, warm, setWarm, fever, setFever, drainageWorse, setDrainageWorse }) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
        How Are You Feeling?
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Your input helps the AI create a fuller picture of your healing.
      </p>

      {/* Pain Scale */}
      <div className="p-5 bg-card rounded-2xl border border-border mb-5">
        <PainSlider value={pain} onChange={setPain} />
      </div>

      {/* Warm to touch */}
      <div className="p-5 bg-card rounded-2xl border border-border mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Temperature Check
          </span>
        </div>
        <p className="text-sm text-foreground mb-4">Is the area around your wound warm to the touch?</p>
        <div className="flex gap-3">
          {[
            { value: true, label: 'Yes, it feels warm' },
            { value: false, label: 'No, normal temperature' },
          ].map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => setWarm(opt.value)}
              className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                warm === opt.value
                  ? opt.value
                    ? 'bg-warning/15 text-warning border-2 border-warning/30'
                    : 'bg-success/15 text-success border-2 border-success/30'
                  : 'bg-muted text-muted-foreground border-2 border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <ToggleRow
        label="Have you had fever or chills since the last check-in?"
        value={fever}
        setValue={setFever}
        yesLabel="Yes, fever/chills"
        noLabel="No fever/chills"
      />

      <ToggleRow
        label="Has drainage/discharge increased or become worse?"
        value={drainageWorse}
        setValue={setDrainageWorse}
        yesLabel="Yes, worse drainage"
        noLabel="No, same or better"
      />

      {/* Info note */}
      <div className="flex items-start gap-3 p-4 bg-accent rounded-2xl">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          AI photo confidence stays as the base score. Survey agreement can raise confidence, and mismatch can lower it.
        </p>
      </div>
    </div>
  );
}