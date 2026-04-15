import { Link, useParams } from 'react-router-dom';
import ResultCard from '@/components/healtrack/ResultCard';
import { Button } from '@/components/ui/button';
import { getCheckInById } from '@/lib/storage';

export default function Results() {
  const { checkInId } = useParams();
  const result = getCheckInById(checkInId);

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-3">Result Not Found</h1>
          <Link to="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-6 pt-8 pb-10">
      <h1 className="text-2xl font-heading font-bold mb-2">Today&apos;s Assessment</h1>
      <p className="text-sm text-muted-foreground mb-6">AI summary based on your latest check-in.</p>

      <ResultCard
        result={result.result}
        summary={result.summary}
        dayNumber={result.dayNumber}
        onAcknowledge={() => null}
        onContactCareTeam={() => window.alert('Please call your care team.')}
        careTeamPhone="+1 555 010 201"
      />

      {result.photoUrl ? (
        <div className="mt-6 rounded-2xl border border-border overflow-hidden">
          <img src={result.photoUrl} alt="Wound check-in" className="w-full h-72 object-cover" />
        </div>
      ) : null}

      <div className="mt-6 flex gap-3">
        <Link to="/dashboard" className="flex-1">
          <Button variant="outline" className="w-full">Dashboard</Button>
        </Link>
        <Link to="/checkin" className="flex-1">
          <Button className="w-full">New Check-in</Button>
        </Link>
      </div>
    </div>
  );
}
