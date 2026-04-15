import { format } from 'date-fns';
import BottomTabBar from '@/components/healtrack/BottomTabBar';
import { getCheckIns } from '@/lib/storage';

export default function Timeline() {
  const checkins = getCheckIns();

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-6 pt-8 pb-24">
      <h1 className="text-2xl font-heading font-bold mb-2">Timeline</h1>
      <p className="text-sm text-muted-foreground mb-6">Review your recent wound check-ins.</p>

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
              <p className="text-xs text-muted-foreground">{item.summary}</p>
            </div>
          ))}
        </div>
      )}

      <BottomTabBar />
    </div>
  );
}
