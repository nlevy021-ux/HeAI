import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import RecoveryDayBadge from '@/components/healtrack/RecoveryDayBadge';
import BottomTabBar from '@/components/healtrack/BottomTabBar';
import ResultCard from '@/components/healtrack/ResultCard';
import { Button } from '@/components/ui/button';
import { getCheckIns, getProfile } from '@/lib/storage';

export default function Dashboard() {
  const profile = getProfile();
  const checkins = getCheckIns();
  const latest = checkins[0];

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-6 pt-8 pb-24">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">HealTrack</p>
        <h1 className="text-3xl font-heading font-bold">Recovery Dashboard</h1>
      </div>

      <div className="mb-6">
        <RecoveryDayBadge surgeryDate={profile.surgery_date} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <p className="text-sm text-muted-foreground mb-1">Next check-in</p>
        <p className="text-lg font-semibold">{format(new Date(), 'EEEE, MMM d')}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Frequency: {profile.checkin_frequency?.replaceAll('_', ' ') || 'daily'}
        </p>
        <Link to="/checkin">
          <Button className="mt-4 w-full rounded-xl">Start Today&apos;s Check-in</Button>
        </Link>
      </div>

      {latest ? (
        <ResultCard
          result={latest.result}
          dayNumber={latest.dayNumber}
          summary={latest.summary}
          onAcknowledge={() => null}
          onContactCareTeam={() => window.alert('Contact your care team immediately.')}
          careTeamPhone="+1 555 010 201"
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          No check-ins yet. Add your first photo and symptom survey to start tracking trends.
        </div>
      )}

      <BottomTabBar />
    </div>
  );
}
