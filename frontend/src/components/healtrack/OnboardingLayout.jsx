import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProgressBar from './ProgressBar';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingLayout({ step, totalSteps, onBack, onNext, nextLabel, nextDisabled, children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center px-4 pt-3">
        {step > 1 && (
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>

      <ProgressBar currentStep={step} totalSteps={totalSteps} />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col px-6 pt-6 pb-4 overflow-y-auto"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Bottom CTA */}
      <div className="px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={onNext}
          disabled={nextDisabled}
          className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20 transition-all"
          size="lg"
        >
          {nextLabel || 'Continue'}
        </Button>
      </div>
    </div>
  );
}