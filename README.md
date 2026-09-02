# Health Navigator

Health Navigator is a privacy-first mobile health companion built with Expo/React Native, TypeScript and Supabase.

## Current capabilities

- Email authentication
- Free-text symptom intake
- Russian voice symptom input
- Multi-domain symptom routing
- Safety escalation: urgent / medical review / self-care review
- Follow-up questions and episode history
- Personal measurements
- Android Health Connect import
- Protected health-photo storage
- Evidence/provenance layer for medical and traditional-health knowledge
- Traditional-practice evidence contour with explicit safety/evidence status
- Text-to-speech for assessment status
- Supabase Row Level Security and owner-scoped RPCs

## Android production

The production EAS profile is configured for an Android App Bundle (`.aab`).

```bash
npm install
npx expo prebuild
npx eas build --platform android --profile production
```

The Google Play package identifier is `com.incore.healthnavigator`.

## Important medical boundary

Health Navigator is not a diagnostic device and does not replace emergency or clinical care. Medical rules are kept separate from the conversational layer and are expected to have provenance and review status.

The app must not invent medication doses, diagnose from a photograph, or treat traditional use as proof of efficacy.

## Privacy

See `docs/PRIVACY.md` for the current product privacy notice and data-handling model.

## CI

GitHub Actions validates TypeScript and performs an Expo web export on pushes and pull requests to `main`.
