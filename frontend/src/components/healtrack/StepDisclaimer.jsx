import { AlertTriangle, Phone, ShieldCheck, Brain } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function StepDisclaimer({ accepted, setAccepted }) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
        Important Information
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Please review the following before getting started.
      </p>

      <div className="space-y-4 flex-1">
        {/* Section 1: AI Disclaimer */}
        <div className="p-4 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">AI-Powered, Not a Doctor</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            HealTrack uses artificial intelligence to analyze wound photos. It is a supportive monitoring tool — not a medical device, diagnosis, or replacement for professional medical care.
          </p>
        </div>

        {/* Section 2: Limitations */}
        <div className="p-4 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-semibold text-foreground">What We Can't Detect</h3>
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
              Odors or unusual smells from the wound site
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
              Fever, chills, or internal infection symptoms
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
              Pain intensity beyond your self-reported scale
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
              Allergic reactions or systemic responses
            </li>
          </ul>
        </div>

        {/* Section 3: When to call */}
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">When in Doubt, Call Your Doctor</h3>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>This system supports your recovery journey alongside your care team</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>If you're truly concerned, skip the app and contact your surgeon or nurse directly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agreement */}
      <div className="mt-6 p-4 bg-muted rounded-2xl flex items-start gap-3">
        <Checkbox
          id="disclaimer"
          checked={accepted}
          onCheckedChange={setAccepted}
          className="mt-0.5"
        />
        <label htmlFor="disclaimer" className="text-xs text-foreground leading-relaxed cursor-pointer">
          I understand this app's purpose and limitations. I will contact my care team for any serious concerns.
        </label>
      </div>
    </div>
  );
}