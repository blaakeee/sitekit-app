# SiteKit Dev Log

## 2026-06-24 — Initial Build

### What happened
Built the complete SiteKit field capture app from HTML/CSS prototypes exported from Claude Design. The prototype had two variants — "Big Buttons" (explicit capture buttons) and "Voice First" (single mic, auto-sort). We combined both: Prototype A's four-button grid as the foundation, with Prototype B's voice-first recording + auto-sort flow grafted in.

### What was built
- **13 screens** pixel-matched to the prototype designs
- Home (today's jobs), Job Capture, Voice Record, Voice Review, Estimate/Add-on, Finish Job, Crew List, Employee Profile, Schedule, Certifications, Call, Send Note, Daily Inventory
- **Design system**: Archivo + JetBrains Mono + Material Symbols fonts, full color token system, shared components (Icon, MonoLabel, BackButton, ScreenWrapper)
- **Navigation**: React Navigation native stack with slide transitions
- **Mock data layer** with realistic contractor data (3 jobs, 3 crew members, inventory, estimates)

### Tech stack
- React Native (Expo SDK 56) with TypeScript
- EAS Build for Android APK (dev client)
- Tested on physical Android device

### Issues resolved
- `expo-av` crashes on SDK 56 due to `LazyKType` Kotlin error — removed, replaced with `expo-audio` later
- Expo Go incompatible with SDK 56 — switched to EAS development builds
- First successful APK build and on-device test

---

## 2026-06-25 — Firebase, Auth, Audio & AI Transcription (continued from 2026-06-24)

### What happened
Added the backend infrastructure: Firebase for data sync, Google Sign-In for auth, real voice recording, and AI-powered transcription with auto-categorization. Spent significant time fighting Gradle build issues before landing on the right architecture.

### Features added

**Google Sign-In**
- Native OAuth flow via `@react-native-google-signin/google-signin`
- Auth-gated navigation — SignInScreen renders before main stack
- Auto-creates organization in Firestore on first sign-in

**Firestore Backend**
- Firebase JS SDK (not native — see Architecture Decisions below)
- Real-time listeners for jobs, crew, inventory via React Context (`DataContext`)
- Write operations via `firestoreService.ts` (addCapture, updateJob, addEstimate, etc.)
- Falls back to mock data when Firestore collections are empty
- Seed data utility for populating Firestore with test data

**Voice Recording**
- Real audio recording via `expo-audio` (`useAudioRecorder` hook)
- Live duration timer during recording
- Recording saves to device, URI passed to review screen

**AI Transcription + Auto-Sort**
- OpenAI Whisper API for speech-to-text
- GPT-4o-mini parses transcript into structured categories: materials, time, issues, notes
- Results displayed on Voice Review screen with quantity controls and edit options
- "Add all to job" writes parsed entries to Firestore

**Offline Queue**
- Recordings saved locally when no connection
- Queue persisted in AsyncStorage
- `syncManager` listens to NetInfo, processes queue on reconnect
- Max 3 retry attempts per item

### Architecture decisions

**Firebase JS SDK over `@react-native-firebase` (native)**
The native Firebase SDK (`@react-native-firebase/app`) injects `com.google.gms:google-services` into the Gradle build chain, which triggers a known incompatibility between `foojay-resolver-convention` 0.5.0 and Gradle 9.x (`JvmVendorSpec.IBM_SEMERU` was removed). This is an upstream React Native 0.85 issue ([facebook/react-native#55781](https://github.com/facebook/react-native/issues/55781)). After multiple failed EAS builds trying various fixes (patch-package, config plugins, image pinning), switched to the Firebase JS SDK which is pure JavaScript — zero Gradle config. The tradeoff is negligible for our data scale (dozens of jobs, not thousands). Native modules can be added individually later when specific features demand them (FCM push notifications, Crashlytics).

**`XMLHttpRequest` for Whisper uploads**
React Native's `fetch` doesn't support the `{uri, type, name}` FormData pattern needed for file uploads. `XMLHttpRequest` handles it natively. This is the standard pattern for file uploads in React Native.

**`getAuth()` over `initializeAuth()` with persistence**
`getReactNativePersistence` from Firebase Auth isn't properly exported in the default TypeScript types for React Native. Using `getAuth()` works but auth sessions don't persist across app restarts. This is a known Firebase JS SDK + React Native typing issue — functional fix deferred.

### Files added (33 changed, +2,814 / -463)

```
src/config/firebase.ts          — Firebase JS SDK initialization
src/config/apiKeys.ts           — OpenAI API key from env
src/contexts/AuthContext.tsx     — Google Sign-In + org management
src/contexts/DataContext.tsx     — Firestore real-time listeners
src/services/audioService.ts     — expo-audio recording hook
src/services/transcriptionService.ts — Whisper + GPT-4o-mini
src/services/firestoreService.ts — Firestore write operations
src/services/queueService.ts     — Offline queue (AsyncStorage)
src/services/syncManager.ts      — Auto-process queue on reconnect
src/hooks/useJobCaptures.ts      — Firestore listener for captures
src/hooks/useNetworkStatus.ts    — NetInfo connectivity hook
src/screens/SignInScreen.tsx      — Auth screen with Google button
src/types/index.ts               — Extracted + new types
src/utils/seedData.ts            — Firestore seed utility
app.config.ts                    — Replaced app.json (dynamic config)
eas.json                         — EAS build profiles
plugins/withGoogleServicesVersion.js — Gradle plugin version fix
plugins/withFoojayFix.js         — foojay-resolver patch
patches/@react-native+gradle-plugin+0.85.3.patch — foojay 0.5→1.0
```

### Issues resolved
- `expo-av` LazyKType crash → replaced with `expo-audio`
- EAS build: `google-services.json` not in git → uploaded as EAS secret file env var
- EAS build: `com.google.gms:google-services:4.4.4` incompatible with Gradle 9.x → custom config plugin to upgrade to 4.5.0
- EAS build: `foojay-resolver-convention:0.5.0` references removed `IBM_SEMERU` → patch-package to 1.0.0
- EAS build: all Gradle fixes failed due to native Firebase SDK → **switched to Firebase JS SDK** (zero Gradle config, build succeeds)
- Google Sign-In `DEVELOPER_ERROR` → package name mismatch in Firebase (`site.kit` vs `com.synaptic86.sitekit`), fixed by re-registering Android app
- SafeAreaProvider crash on SignInScreen → wrapped app root with `SafeAreaProvider`
- `expo-file-system` `getInfoAsync` deprecated in SDK 56 → removed dependency
- Whisper upload `FormData` incompatible with RN `fetch` → switched to `XMLHttpRequest`
- Metro module resolution failure for `@firebase/auth` → clean `node_modules` reinstall

### Repo
Moved from nested `field-app-prototypes/SiteKit` to standalone repo: **[blaakeee/sitekit-app](https://github.com/blaakeee/sitekit-app)**
