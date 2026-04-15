import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '@/components/healtrack/OnboardingLayout';
import OnboardingComplete from '@/components/healtrack/OnboardingComplete';
import StepPermissions from '@/components/healtrack/StepPermissions';
import StepDisclaimer from '@/components/healtrack/StepDisclaimer';
import StepDataIntegration from '@/components/healtrack/StepDataIntegration';
import StepCameraTutorial from '@/components/healtrack/StepCameraTutorial';
import StepCalibration from '@/components/healtrack/StepCalibration';
import { getProfile, saveProfile } from '@/lib/storage';

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [complete, setComplete] = useState(false);
  const [profile, setProfile] = useState(getProfile());

  useEffect(() => {
    if (profile.onboardingComplete) {
      navigate('/dashboard');
    }
  }, [navigate, profile.onboardingComplete]);

  const nextDisabled = useMemo(() => {
    if (step === 1) return !(profile.cameraGranted && profile.notifGranted);
    if (step === 2) return !profile.disclaimerAccepted;
    if (step === 3) return !(profile.surgery_date && profile.surgery_type && profile.surgeon_name);
    if (step === 5) return !(profile.closure_methods?.length && profile.checkin_frequency);
    return false;
  }, [profile, step]);

  const persist = (updater) => {
    setProfile((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveProfile(next);
      return next;
    });
  };

  const handleNext = () => {
    if (step >= TOTAL_STEPS) {
      const nextProfile = { ...profile, onboardingComplete: true };
      saveProfile(nextProfile);
      setProfile(nextProfile);
      setComplete(true);
      return;
    }
    setStep((value) => value + 1);
  };

  if (complete) {
    return (
      <OnboardingComplete
        onDashboard={() => navigate('/dashboard')}
        onEdit={() => {
          setComplete(false);
          setStep(3);
        }}
      />
    );
  }

  return (
    <OnboardingLayout
      step={step}
      totalSteps={TOTAL_STEPS}
      onBack={() => setStep((value) => Math.max(1, value - 1))}
      onNext={handleNext}
      nextDisabled={nextDisabled}
      nextLabel={step === TOTAL_STEPS ? 'Finish Setup' : 'Continue'}
    >
      {step === 1 && (
        <StepPermissions
          cameraGranted={profile.cameraGranted}
          setCameraGranted={(v) => persist((prev) => ({ ...prev, cameraGranted: v }))}
          notifGranted={profile.notifGranted}
          setNotifGranted={(v) => persist((prev) => ({ ...prev, notifGranted: v }))}
        />
      )}
      {step === 2 && (
        <StepDisclaimer
          accepted={profile.disclaimerAccepted}
          setAccepted={(v) => persist((prev) => ({ ...prev, disclaimerAccepted: !!v }))}
        />
      )}
      {step === 3 && <StepDataIntegration data={profile} setData={persist} />}
      {step === 4 && <StepCameraTutorial />}
      {step === 5 && <StepCalibration data={profile} setData={persist} />}
    </OnboardingLayout>
  );
}
