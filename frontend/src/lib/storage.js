const PROFILE_KEY = 'healtrack.profile';
const CHECKINS_KEY = 'healtrack.checkins';

const defaultProfile = {
  onboardingComplete: false,
  cameraGranted: false,
  notifGranted: false,
  disclaimerAccepted: false,
  data_source: 'manual',
  surgery_date: '',
  surgery_type: '',
  surgeon_name: '',
  closure_methods: [],
  taking_medications: false,
  medications_list: '',
  checkin_frequency: 'daily',
};

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...defaultProfile };
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch (_error) {
    return { ...defaultProfile };
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getCheckIns() {
  try {
    const raw = localStorage.getItem(CHECKINS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (_error) {
    return [];
  }
}

export function saveCheckIn(entry) {
  const current = getCheckIns();
  const next = [entry, ...current];
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(next));
  return entry;
}

export function getCheckInById(id) {
  return getCheckIns().find((item) => item.id === id);
}
