import { Camera, Bell, Shield, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function StepPermissions({ cameraGranted, setCameraGranted, notifGranted, setNotifGranted }) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6"
        >
          <Heart className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-3">
          Welcome to HealTrack
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
          We use your camera to take photos of your wound and AI to track your healing progress — privately and securely on your device.
        </p>
      </div>

      {/* Info cards */}
      <div className="space-y-3 mb-8">
        <div className="flex items-start gap-3 p-4 bg-card rounded-2xl border border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Private & Secure</p>
            <p className="text-xs text-muted-foreground mt-0.5">Photos are analyzed on-device. Your data stays with you.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-card rounded-2xl border border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Smart Photo Analysis</p>
            <p className="text-xs text-muted-foreground mt-0.5">AI compares daily photos to detect changes in your wound's appearance.</p>
          </div>
        </div>
      </div>

      {/* Permission Buttons */}
      <div className="space-y-3 mt-auto">
        <Button
          variant={cameraGranted ? "outline" : "default"}
          onClick={() => setCameraGranted(true)}
          className={`w-full h-14 rounded-2xl justify-start gap-3 text-sm font-medium transition-all ${cameraGranted ? 'border-primary/30 bg-primary/5 text-primary' : ''}`}
        >
          <Camera className="w-5 h-5" />
          <span className="flex-1 text-left">{cameraGranted ? 'Camera Access Granted' : 'Allow Camera Access'}</span>
          {cameraGranted && <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">✓</span>}
        </Button>
        <Button
          variant={notifGranted ? "outline" : "default"}
          onClick={() => setNotifGranted(true)}
          className={`w-full h-14 rounded-2xl justify-start gap-3 text-sm font-medium transition-all ${notifGranted ? 'border-primary/30 bg-primary/5 text-primary' : ''}`}
        >
          <Bell className="w-5 h-5" />
          <span className="flex-1 text-left">{notifGranted ? 'Notifications Enabled' : 'Enable Notifications'}</span>
          {notifGranted && <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">✓</span>}
        </Button>
      </div>
    </div>
  );
}