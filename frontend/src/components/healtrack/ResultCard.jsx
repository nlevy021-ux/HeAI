import { CheckCircle2, AlertTriangle, AlertOctagon, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const RESULTS = {
  normal: {
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
    title: 'Looking Good',
    iconBg: 'bg-success/15',
  },
  monitor: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    title: 'Monitoring',
    iconBg: 'bg-warning/15',
  },
  at_risk: {
    icon: AlertOctagon,
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    title: 'Needs Attention',
    iconBg: 'bg-danger/15',
  },
};

function toPercent(value) {
  if (typeof value !== 'number') return null;
  return `${Math.round(value * 100)}%`;
}

export default function ResultCard({
  result,
  dayNumber,
  summary,
  onContactCareTeam,
  onAcknowledge,
  careTeamPhone,
  aiConfidence,
  adjustedConfidence,
  surveyConfidence,
  confidenceAgreement,
}) {
  const config = RESULTS[result] || RESULTS.normal;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`p-6 rounded-3xl border-2 ${config.bg} ${config.border}`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.iconBg}`}>
          <Icon className={`w-7 h-7 ${config.color}`} />
        </div>
        <div>
          <h3 className={`text-lg font-heading font-bold ${config.color}`}>{config.title}</h3>
          {dayNumber && (
            <span className="text-xs text-muted-foreground">Day {dayNumber} Assessment</span>
          )}
        </div>
      </div>

      <p className="text-sm text-foreground leading-relaxed mb-4">{summary}</p>

      {typeof aiConfidence === 'number' ? (
        <div className="mb-4 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground space-y-1.5">
          <p><span className="font-semibold text-foreground">AI confidence:</span> {toPercent(aiConfidence)}</p>
          {typeof surveyConfidence === 'number' ? (
            <p><span className="font-semibold text-foreground">Survey confidence:</span> {toPercent(surveyConfidence)}</p>
          ) : null}
          <p><span className="font-semibold text-foreground">Weighted confidence (2:1 image:survey):</span> {toPercent(adjustedConfidence ?? aiConfidence)}</p>
          {confidenceAgreement ? (
            <p>
              <span className="font-semibold text-foreground">Survey agreement:</span>{' '}
              {confidenceAgreement === 'match' ? 'Matched image findings' : confidenceAgreement === 'mismatch' ? 'Did not match image findings' : 'Partially matched'}
            </p>
          ) : null}
        </div>
      ) : null}

      {result === 'at_risk' && (
        <div className="space-y-3">
          <Button
            onClick={onContactCareTeam}
            className="w-full h-12 rounded-2xl bg-danger hover:bg-danger/90 text-danger-foreground"
          >
            <Phone className="w-4 h-4 mr-2" />
            Contact Care Team
          </Button>
          {careTeamPhone && (
            <p className="text-xs text-center text-muted-foreground">
              Your care team will review your photo within 2 hours.
            </p>
          )}
        </div>
      )}

      {result === 'monitor' && (
        <div className="p-3 bg-card rounded-xl border border-border text-xs text-muted-foreground">
          We'll prompt you for another check-in sooner than usual. Keep an eye on the area.
        </div>
      )}

      {result === 'normal' && onAcknowledge && (
        <Button onClick={onAcknowledge} variant="outline" className="w-full h-12 rounded-2xl">
          Got it, thanks!
        </Button>
      )}
    </motion.div>
  );
}