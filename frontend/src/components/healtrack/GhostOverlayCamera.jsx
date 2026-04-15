import { useState, useRef } from 'react';
import { Camera, Sun, ZoomIn, Target, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GhostOverlayCamera({ onCapture, instruction }) {
  const [captured, setCaptured] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setCaptured(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    const fileUrl = URL.createObjectURL(file);
    setUploading(false);
    onCapture(fileUrl);
  };

  return (
    <div className="flex-1 flex flex-col">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      
      {!captured ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Camera viewport */}
          <div className="relative w-full aspect-square max-w-[320px] bg-foreground/5 rounded-3xl overflow-hidden border-2 border-dashed border-primary/30 mb-6">
            {/* Ghost overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/5 h-2/5 border-2 border-primary/40 rounded-2xl relative">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
                
                {/* Scan line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-primary/30 animate-scan-line rounded" />
              </div>
            </div>

            {/* Pulse ring */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="w-24 h-24 border-2 border-primary/20 rounded-full"
                animate={{ scale: [0.9, 1.3], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
            </div>

            {/* Tap to capture */}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-transparent hover:bg-foreground/5 transition-colors"
            >
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                <Camera className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{instruction || 'Tap to capture'}</span>
            </button>
          </div>

          {/* Indicators */}
          <div className="flex gap-3 w-full max-w-[320px]">
            {[
              { icon: Target, label: 'Aligned', active: true },
              { icon: Sun, label: 'Good Light', active: true },
              { icon: ZoomIn, label: 'In Range', active: true },
            ].map(({ icon: I, label, active }) => (
              <div key={label} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium ${active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                <I className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden mb-4">
            <img src={captured} alt="Captured wound" className="w-full h-full object-cover" />
            <button
              onClick={() => { setCaptured(null); onCapture(null); }}
              className="absolute top-3 right-3 w-8 h-8 bg-foreground/60 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
              Uploading photo...
            </div>
          )}
          {!uploading && (
            <p className="text-xs text-success font-medium">✓ Photo captured successfully</p>
          )}
        </div>
      )}
    </div>
  );
}