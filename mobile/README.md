# Centre Les Profs — Mobile

Standalone Expo / React Native app for Centre Les Profs.

## Local setup

```bash
cd mobile
npm install
cp .env.example .env
npm start
```

Set these values in `.env`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_SITE_URL`

Never put `SUPABASE_SERVICE_ROLE_KEY` in this app.

## Android APK

Install EAS CLI and sign in to the Expo account:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Then create a test APK:

```bash
eas build --platform android --profile preview
```

The `preview` profile is configured for an installable APK. Production is configured for an Android App Bundle (AAB).

## Architecture

- Website: `main` branch — unchanged by the mobile work.
- Mobile app: `mobile-expo-app` branch.
- App source: `mobile/`.
- Backend: same Supabase project as the website.
