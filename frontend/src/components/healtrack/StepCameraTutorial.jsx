import { useState } from 'react';
import { Sun, Maximize2, Sparkles, ChevronLeft, ChevronRight, Target, Lightbulb, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    icon: Sun,
    title: 'Natural Lighting',
    desc: 'Find a well-lit area with natural or bright white light. Avoid shadows and harsh overhead lighting.',
    good: 'Even, diffused light illuminating the wound area',
    bad: 'Dark shadows, yellow-tinted or dim lighting',
    color: 'bg-amber-50 text-amber-700',
    iconColor: 'text-amber-500',
  },
  {
    icon: Maximize2,
    title: 'Correct Distance',
    desc: 'Hold your phone 6–8 inches from the wound. Use the target overlay to center your wound in the frame.',
    good: 'Wound fills about 60% of the frame, edges visible',
    bad: 'Too close (blurry) or too far (details lost)',
    color: 'bg-blue-50 text-blue-700',
    iconColor: 'text-blue-500',
  },
  {
    icon: Sparkles,
    title: 'Clean Lens',
    desc: 'Give your camera lens a quick wipe with a soft cloth. A clean lens ensures sharp, accurate photos.',
    good: 'Clear, sharp image with accurate colors',
    bad: 'Foggy, smudged, or hazy appearance',
    color: 'bg-purple-50 text-purple-700',
    iconColor: 'text-purple-500',
  },
];

export default function StepCameraTutorial() {
  const [current, setCurrent] = useState(0);
  const step = STEPS[current];
  const Icon = step.icon;

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
        Camera Guide
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Great photos mean better AI analysis. Here's how to capture the best shot.
      </p>

      {/* Carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="flex-1"
        >
          <div className={`rounded-3xl p-6 mb-4 ${step.color}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/60 rounded-2xl flex items-center justify-center">
                <Icon className={`w-6 h-6 ${step.iconColor}`} />
              </div>
              <div>
                <span className="text-xs font-semibold opacity-60">Step {current + 1} of 3</span>
                <h3 className="text-lg font-heading font-bold">{step.title}</h3>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4">{step.desc}</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <span className="mt-0.5">✅</span>
                <span>{step.good}</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <span className="mt-0.5">❌</span>
                <span>{step.bad}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots + Nav */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="p-2 rounded-xl hover:bg-muted disabled:opacity-30 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrent(Math.min(2, current + 1))}
          disabled={current === 2}
          className="p-2 rounded-xl hover:bg-muted disabled:opacity-30 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Alignment Technology Note */}
      <div className="p-4 bg-card rounded-2xl border border-border">
        <p className="text-xs font-semibold text-foreground mb-3">
          📱 Smart Alignment Technology
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Similar to mobile banking check deposits, our camera uses guided alignment to ensure consistent captures.
        </p>
        <div className="flex gap-2">
          {[
            { icon: Target, label: 'Alignment' },
            { icon: Lightbulb, label: 'Light Check' },
            { icon: ZoomIn, label: 'Zoom Guide' },
          ].map(({ icon: I, label }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5 p-2 bg-muted rounded-xl">
              <I className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}