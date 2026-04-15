import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomTabBar from '@/components/healtrack/BottomTabBar';
import GhostOverlayCamera from '@/components/healtrack/GhostOverlayCamera';
import SymptomSurvey from '@/components/healtrack/SymptomSurvey';
import { Button } from '@/components/ui/button';
import { saveCheckIn } from '@/lib/storage';

function analyze(pain, warm) {
  if (warm && pain >= 7) {
    return { result: 'at_risk', summary: 'Signs suggest elevated inflammation. Contact your care team.' };
  }
  if (warm || pain >= 5) {
    return { result: 'monitor', summary: 'Mild concern detected. Re-check soon and monitor symptoms.' };
  }
  return { result: 'normal', summary: 'Healing appears stable today. Keep following your care plan.' };
}

export default function DailyCheckIn() {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState('');
  const [pain, setPain] = useState(3);
  const [warm, setWarm] = useState(false);

  const canSubmit = Boolean(photoUrl);

  const handleSubmit = () => {
    const analysis = analyze(pain, warm);
    const payload = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      photoUrl,
      pain,
      warm,
      ...analysis,
      dayNumber: 1,
    };
    saveCheckIn(payload);
    navigate(`/analysis/${payload.id}`);
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-6 pt-6 pb-24">
      <h1 className="text-2xl font-heading font-bold mb-1">Daily Check-in</h1>
      <p className="text-sm text-muted-foreground mb-6">Capture a wound photo and log your symptoms.</p>

      <GhostOverlayCamera onCapture={setPhotoUrl} instruction="Capture wound photo" />

      <div className="mt-6">
        <SymptomSurvey pain={pain} setPain={setPain} warm={warm} setWarm={setWarm} />
      </div>

      <Button disabled={!canSubmit} onClick={handleSubmit} className="w-full mt-6 h-12 rounded-2xl">
        Analyze Check-in
      </Button>

      <BottomTabBar />
    </div>
  );
}
