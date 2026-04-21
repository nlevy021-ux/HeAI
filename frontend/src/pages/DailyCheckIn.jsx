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

function baseConfidenceForResult(result) {
  if (result === 'at_risk') return 0.84;
  if (result === 'monitor') return 0.71;
  return 0.8;
}

function surveyRiskScore({ pain, warm, fever, drainageWorse }) {
  let score = 0;
  if (pain >= 7) score += 2;
  else if (pain >= 5) score += 1;
  if (warm) score += 2;
  if (fever) score += 3;
  if (drainageWorse) score += 2;
  return score;
}

function surveyConfidenceForResult(result, surveyScore) {
  const maxRiskScore = 9;
  const riskNorm = Math.max(0, Math.min(1, surveyScore / maxRiskScore));

  if (result === 'at_risk') {
    return 0.55 + 0.4 * riskNorm;
  }
  if (result === 'normal') {
    return 0.55 + 0.4 * (1 - riskNorm);
  }

  const monitorTarget = 0.45;
  const normalizedDistance = Math.min(1, Math.abs(riskNorm - monitorTarget) / monitorTarget);
  return 0.55 + 0.35 * (1 - normalizedDistance);
}

function adjustConfidenceBySurvey(result, aiConfidence, symptoms) {
  const score = surveyRiskScore(symptoms);
  const surveyConfidence = surveyConfidenceForResult(result, score);
  const weighted = (2 * aiConfidence + surveyConfidence) / 3;
  const adjustedConfidence = Math.max(0.05, Math.min(0.99, weighted));

  let agreement = 'partial';
  if (surveyConfidence >= 0.78) agreement = 'match';
  else if (surveyConfidence <= 0.62) agreement = 'mismatch';

  return {
    adjustedConfidence: Number(adjustedConfidence.toFixed(2)),
    surveyConfidence: Number(surveyConfidence.toFixed(2)),
    agreement,
    surveyRiskScore: score,
  };
}

export default function DailyCheckIn() {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState('');
  const [pain, setPain] = useState(3);
  const [warm, setWarm] = useState(false);
  const [fever, setFever] = useState(false);
  const [drainageWorse, setDrainageWorse] = useState(false);

  const canSubmit = Boolean(photoUrl);

  const handleSubmit = () => {
    const analysis = analyze(pain, warm);
    const aiConfidence = baseConfidenceForResult(analysis.result);
    const confidenceAdjustment = adjustConfidenceBySurvey(analysis.result, aiConfidence, {
      pain,
      warm,
      fever,
      drainageWorse,
    });
    const payload = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      photoUrl,
      pain,
      warm,
      fever,
      drainageWorse,
      aiConfidence,
      ...confidenceAdjustment,
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
        <SymptomSurvey
          pain={pain}
          setPain={setPain}
          warm={warm}
          setWarm={setWarm}
          fever={fever}
          setFever={setFever}
          drainageWorse={drainageWorse}
          setDrainageWorse={setDrainageWorse}
        />
      </div>

      <Button disabled={!canSubmit} onClick={handleSubmit} className="w-full mt-6 h-12 rounded-2xl">
        Analyze Check-in
      </Button>

      <BottomTabBar />
    </div>
  );
}
