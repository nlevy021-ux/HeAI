import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function AnalysisLoading() {
  const { checkInId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/results/${checkInId}`);
    }, 1500);
    return () => clearTimeout(timer);
  }, [checkInId, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-full border-4 border-muted border-t-primary animate-spin mb-6" />
        <h1 className="text-2xl font-heading font-bold mb-2">Analyzing Your Check-in</h1>
        <p className="text-sm text-muted-foreground">
          Comparing today&apos;s photo and symptoms against your recent trend.
        </p>
      </div>
    </div>
  );
}
