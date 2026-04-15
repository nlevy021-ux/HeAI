# HealTrack Frontend

Standalone React + Vite UI for the HealTrack wound-recovery experience.

## Run locally

1. `npm install`
2. `npm run dev`

App runs by default on `http://localhost:5173`.

## Current behavior

- Onboarding flow for surgery/recovery setup
- Daily wound check-in with image capture and symptom survey
- Local analysis scoring and result cards
- Timeline + profile pages backed by browser localStorage

## Notes

- The frontend no longer depends on Base44 plugins/SDK.
- Check-in and profile data are persisted in local storage keys:
  - `healtrack.profile`
  - `healtrack.checkins`
