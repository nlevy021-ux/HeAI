import { format } from 'date-fns';
import BottomTabBar from '@/components/healtrack/BottomTabBar';
import { getCheckIns } from '@/lib/storage';

const RISK_BASE_BY_RESULT = {
  normal: 0.2,
  monitor: 0.55,
  at_risk: 0.85,
};

const TREND_THRESHOLDS = {
  worseningDelta: 0.12,
  meaningfulImprovement: 0.03,
  staleWindowDays: 3,
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function infectionRiskScore(checkin) {
  const base = RISK_BASE_BY_RESULT[checkin.result] ?? 0.5;
  const confidence = typeof checkin.adjustedConfidence === 'number'
    ? checkin.adjustedConfidence
    : typeof checkin.aiConfidence === 'number'
      ? checkin.aiConfidence
      : 0.7;
  // Keeps class semantics while letting confidence shape intensity.
  return clamp01(base * (0.6 + 0.4 * confidence));
}

function getTrendAlerts(chronological) {
  if (chronological.length < 2) return [];

  const alerts = [];
  const latest = chronological[chronological.length - 1];
  const previous = chronological[chronological.length - 2];
  const latestDelta = latest.riskScore - previous.riskScore;

  if (latestDelta >= TREND_THRESHOLDS.worseningDelta) {
    alerts.push({
      type: 'worsening',
      title: 'Risk increased quickly',
      message: 'Your latest check-in shows a notable increase in infection risk score compared with the previous day.',
    });
  }

  const window = chronological.slice(-TREND_THRESHOLDS.staleWindowDays);
  if (window.length === TREND_THRESHOLDS.staleWindowDays) {
    const first = window[0].riskScore;
    const last = window[window.length - 1].riskScore;
    const improvement = first - last;
    if (improvement < TREND_THRESHOLDS.meaningfulImprovement) {
      alerts.push({
        type: 'stalled',
        title: 'Progress appears stalled',
        message: `Risk score has not improved meaningfully over the last ${TREND_THRESHOLDS.staleWindowDays} check-ins.`,
      });
    }
  }

  return alerts;
}

export default function Timeline() {
  const checkins = getCheckIns().map((item) => ({
    ...item,
    riskScore: infectionRiskScore(item),
  }));
  const chronological = [...checkins].reverse();
  const alerts = getTrendAlerts(chronological);
  const latest = checkins[0];
  const previous = checkins[1];
  const latestDelta = latest && previous ? latest.riskScore - previous.riskScore : null;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-6 pt-8 pb-24">
      <h1 className="text-2xl font-heading font-bold mb-2">Timeline</h1>
      <p className="text-sm text-muted-foreground mb-6">Review your recent wound check-ins.</p>

      {latest ? (
        <div className="rounded-2xl border border-border bg-card p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Latest risk score</p>
          <p className="text-xl font-semibold">{Math.round(latest.riskScore * 100)} / 100</p>
          {latestDelta !== null ? (
            <p className={`text-xs mt-2 ${latestDelta > 0 ? 'text-danger' : latestDelta < 0 ? 'text-success' : 'text-muted-foreground'}`}>
              {latestDelta > 0 ? 'Up' : latestDelta < 0 ? 'Down' : 'Unchanged'} by {Math.round(Math.abs(latestDelta) * 100)} points since last check-in
            </p>
          ) : null}
        </div>
      ) : null}

      {alerts.length > 0 ? (
        <div className="space-y-2 mb-4">
          {alerts.map((alert) => (
            <div
              key={alert.type}
              className={`rounded-2xl border p-4 ${
                alert.type === 'worsening' ? 'border-danger/30 bg-danger/10' : 'border-warning/30 bg-warning/10'
              }`}
            >
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
            </div>
          ))}
        </div>
      ) : null}

      {checkins.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Your timeline will populate after your first check-in.
        </div>
      ) : (
        <div className="space-y-3">
          {checkins.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">{format(new Date(item.createdAt), 'MMM d, yyyy')}</p>
                <span className="text-xs text-muted-foreground">{item.result.replace('_', ' ')}</span>
              </div>
              <p className="text-xs mb-1">
                Risk score: <span className="font-semibold">{Math.round(item.riskScore * 100)} / 100</span>
                {typeof item.adjustedConfidence === 'number'
                  ? ` • Confidence: ${Math.round(item.adjustedConfidence * 100)}%`
                  : ''}
              </p>
              <p className="text-xs text-muted-foreground">{item.summary}</p>
            </div>
          ))}
        </div>
      )}

      <BottomTabBar />
    </div>
  );
}
