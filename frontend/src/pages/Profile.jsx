import { useState } from 'react';
import BottomTabBar from '@/components/healtrack/BottomTabBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getProfile, saveProfile } from '@/lib/storage';

export default function Profile() {
  const [profile, setProfile] = useState(getProfile());

  const update = (field, value) => {
    const next = { ...profile, [field]: value };
    setProfile(next);
    saveProfile(next);
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-6 pt-8 pb-24">
      <h1 className="text-2xl font-heading font-bold mb-2">Profile</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your recovery details.</p>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <Label className="mb-2 block">Surgery Date</Label>
          <Input
            type="date"
            value={profile.surgery_date}
            onChange={(event) => update('surgery_date', event.target.value)}
          />
        </div>
        <div>
          <Label className="mb-2 block">Surgery Type</Label>
          <Input value={profile.surgery_type} onChange={(event) => update('surgery_type', event.target.value)} />
        </div>
        <div>
          <Label className="mb-2 block">Surgeon Name</Label>
          <Input value={profile.surgeon_name} onChange={(event) => update('surgeon_name', event.target.value)} />
        </div>

        <Button
          variant="outline"
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
          className="w-full mt-2"
        >
          Reset App Data
        </Button>
      </div>

      <BottomTabBar />
    </div>
  );
}
