import { useState } from 'react';
import { Calendar, Search, User, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SURGERY_TYPES = [
  'Appendectomy', 'Cesarean Section (C-Section)', 'Cholecystectomy (Gallbladder)',
  'Hip Replacement', 'Knee Replacement', 'Hernia Repair', 'Mastectomy',
  'Coronary Artery Bypass', 'Spinal Fusion', 'Laparoscopic Surgery',
  'Tonsillectomy', 'Rotator Cuff Repair', 'ACL Reconstruction',
  'Hysterectomy', 'Thyroidectomy', 'Carpal Tunnel Release', 'Other'
];

export default function StepDataIntegration({ data, setData }) {
  const [mode, setMode] = useState(data.data_source || 'manual');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = SURGERY_TYPES.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
        Surgery Details
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Let's start with some basics about your procedure.
      </p>

      {/* Toggle */}
      <div className="flex bg-muted rounded-2xl p-1 mb-8">
        <button
          onClick={() => { setMode('synced'); setData(d => ({ ...d, data_source: 'synced' })); }}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${mode === 'synced' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          <Link2 className="w-3.5 h-3.5" />
          Sync with Portal
        </button>
        <button
          onClick={() => { setMode('manual'); setData(d => ({ ...d, data_source: 'manual' })); }}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-semibold transition-all ${mode === 'manual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Enter Manually
        </button>
      </div>

      {mode === 'synced' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Link2 className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Connect to MyChart / Epic</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Your surgery details will be automatically imported from your patient portal.
          </p>
          <button
            className="mt-4 text-sm font-semibold text-primary underline underline-offset-2"
            onClick={() => {
              setData(d => ({ ...d, data_source: 'synced', surgery_date: '2026-03-28', surgery_type: 'Appendectomy', surgeon_name: 'Dr. Sarah Chen' }));
            }}
          >
            Simulate Sync
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-5">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Surgery Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={data.surgery_date || ''}
                onChange={e => setData(d => ({ ...d, surgery_date: e.target.value }))}
                className="pl-11 h-14 rounded-2xl border-border bg-card text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Surgery Type
            </Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                value={searchTerm || data.surgery_type || ''}
                placeholder="Search procedures..."
                onFocus={() => setSearchOpen(true)}
                onChange={e => { setSearchTerm(e.target.value); setSearchOpen(true); }}
                className="pl-11 h-14 rounded-2xl border-border bg-card text-sm"
              />
              {searchOpen && searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-lg max-h-48 overflow-y-auto z-20">
                  {filtered.map(s => (
                    <button
                      key={s}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                      onClick={() => { setData(d => ({ ...d, surgery_type: s })); setSearchTerm(''); setSearchOpen(false); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {data.surgery_type && !searchTerm && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
                {data.surgery_type}
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Surgeon Name
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={data.surgeon_name || ''}
                placeholder="e.g., Dr. Smith"
                onChange={e => setData(d => ({ ...d, surgeon_name: e.target.value }))}
                className="pl-11 h-14 rounded-2xl border-border bg-card text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}