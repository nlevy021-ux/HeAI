import { CheckCircle2, ArrowRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function OnboardingComplete({ onDashboard, onEdit }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center max-w-md mx-auto px-6">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-24 h-24 bg-success/15 rounded-full flex items-center justify-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <CheckCircle2 className="w-12 h-12 text-success" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-2xl font-heading font-bold text-foreground mb-3">
          You're All Set!
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Your baseline has been recorded. HealTrack will now monitor your healing progress with daily check-ins.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full space-y-3"
      >
        <Button
          onClick={onDashboard}
          className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
          size="lg"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <Button
          onClick={onEdit}
          variant="outline"
          className="w-full h-14 rounded-2xl text-base font-medium"
          size="lg"
        >
          <Settings className="w-5 h-5 mr-2" />
          Edit Recovery Details
        </Button>
      </motion.div>
    </div>
  );
}