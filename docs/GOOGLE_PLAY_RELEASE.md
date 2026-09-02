# Google Play release checklist

## Already configured in the project

- Android application ID: `com.incore.healthnavigator`
- Expo Router
- Camera/audio/activity-recognition permissions
- Speech recognition config plugin
- Health Connect config plugin
- Production EAS profile configured for Android App Bundle
- Privacy policy draft in `docs/PRIVACY.md`
- CI TypeScript + Expo web export

## Required outside the repository

1. Create/configure the Google Play Console application.
2. Complete the Health apps declaration and Data safety form.
3. Publish the final privacy-policy URL on a publicly accessible HTTPS page.
4. Add a real support/contact email.
5. Prepare store icon, screenshots, short description and full description.
6. Configure Google Play billing/subscription products if paid plans are enabled.
7. Configure EAS credentials/signing for the Android application.
8. Build and upload the signed `.aab` to an internal testing track.
9. Test authentication, symptom assessment, emergency escalation, voice, photos and Health Connect on a physical Android device.
10. Complete the Play review declarations for health-related functionality.

## Medical release gate

Do not publish diagnostic claims. Photo attachment is storage/episode context only until a validated clinical image-analysis pipeline and its safety review are implemented.

Do not publish a numeric `CORE INDEX` as a medical score. It is currently a product placeholder and must be replaced with a clinically defined, sourced calculation before being presented as a health metric.
