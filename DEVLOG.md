# SiteKit Dev Log

## 2026-06-28 — Capture Flows Complete, Estimate Costing Architecture

### What happened
Completed all four capture types on the JobCapture screen (voice, photo, time+parts, flag issue). Built the camera feature with architecture-doc-driven implementation. Restructured estimate line items with labour/material classification and estimated hours to support the forward/back costing data loop defined in the new estimate-costing-spec.

### Features added

**Photo capture** (`src/features/camera/`)
- `expo-camera` CameraView as primary, `expo-image-picker` as silent fallback
- Runtime device capability probe persisted in AsyncStorage — classifies devices as `full` or `fallback`
- Three renditions generated on-device: thumb (200px), display (800px), web (2000px) via `expo-image-manipulator`
- GPS metadata captured via `expo-location` (opportunistic, never blocks)
- Haptic shutter feedback, preview with retake/confirm flow
- Photo viewer screen for tapping captured photos in the job list
- Upload queue stubbed (logs only) — R2 integration deferred

**Flag issue capture**
- Title (required) + description (optional) + severity picker (Low/Medium/High)
- Saves to Firestore as `type: 'issue'` capture with severity in subtitle

**Time + Parts capture**
- Hours/minutes entry with large mono inputs + optional description
- Add/remove parts with name and quantity
- Atomic `writeBatch` saves time as a capture + each part as a materials capture

**Estimate line items — labour/material classification**
- Each line item now tagged as `labour` or `material` via toggle in edit form
- Labour lines show an "Est. hours" field — the forward-costing number for v2 variance
- Kind badge (clock/box icon) in collapsed line item view
- Voice-to-estimate AI prompt updated to return `kind` and `estimatedHours`
- Job description field stored on estimate for v2 agent semantic retrieval
- `paramValues` field wired in types and Firestore save — ready for parametric templates

### Architecture documents added
- `docs/architecture/camera/CAMERA_ARCHITECTURE.md` — full camera capture pipeline spec (proof-of-work photos, before/after overlay, device detection, renditions, R2 upload)
- `docs/architecture/camera/estimate-costing-spec/estimate-costing-spec.md` — forward/back costing data model, symmetry requirement, trainable-job contract, v2 agent architecture

### Issues resolved
- Firestore org lookup failing with membership-based security rules → switched from collection query (`where` + `getDocs`) to direct document read (`getDoc` on `org_{uid}`)
- `StyleSheet.absoluteFillObject` removed in RN 0.85 → replaced with explicit position values

### Dependencies added
- `expo-image-picker`, `expo-image-manipulator`, `expo-location`, `expo-device`
- All Expo managed compatible, plugins added to `app.config.ts`

### What's not yet built
- **Close-out flow rebuild** (FinishJob → per-line actual entry mapping to estimate lines) — next priority, ~1.5 hrs
- **Variance computation + display** at close — ~30 min
- **Variance note prompt** on large variance — ~20 min
- **Trainable-job validation gate** — ~20 min
- **Template CRUD** (save estimate as reusable template) — ~2 hrs
- **Cloudflare R2 photo upload** — needs account setup + backend presign endpoint
- **SendNote wiring** — ~15 min
- **Job timer + clock-in** — ~5 hrs total
- **Before/after ghost overlay** on camera — ~1 hr

---

## 2026-06-27 — Full Firestore Wiring, Voice-to-Estimate, Code Review Hardening

### What happened
Wired every screen in the app to live Firestore data, replacing all mock data imports. Built the voice-to-estimate pipeline. Provisioned Firestore database and resolved auth/permissions issues. Completed a full code review pass addressing 13 findings. Shipped a new EAS dev build and tested on physical Android device.

### Features added

**All 14 screens wired to Firestore**
- Home, JobCapture, Estimate, FinishJob, CrewList, Inventory, EmployeeProfile, EmployeeSchedule, EmployeeCerts, CallScreen, SendNote, VoiceRecord, VoiceReview, SignIn — all now pull data from Firestore via `useJobs()`, `useCrew()`, and `useInventory()` hooks
- Mock data used as fallback only when Firestore collections are empty

**Estimate screen — fully interactive**
- Editable line items with add/remove/edit (name, qty, unit, price)
- Mandatory customer name + site address form for new estimates
- Saves to Firestore, auto-creates job documents
- Validation: incomplete line items (missing qty or price) are flagged and must be filled

**Voice-to-estimate pipeline**
- Record voice note from estimate screen → Whisper transcription → GPT-4o-mini parses into billable line items
- Separate AI prompt optimized for estimate extraction (tries to pull quantities and prices)
- Parsed items added to estimate with missing fields highlighted for manual entry
- Items missing qty/price show a warning badge and block submission until completed

**FinishJob screen wired**
- Live capture count from Firestore, real job stats (time on site, quoted amount)
- "Complete & sync" calls `completeJob()` to set status in Firestore
- Email checkbox toggles

**CallScreen — real phone dialer**
- Opens native dialer via `Linking.openURL('tel:...')` on screen mount

**Firestore infrastructure**
- Provisioned Firestore database (northamerica-northeast1 / Montréal)
- Security rules: authenticated users only
- `ensureJobExists()` and `createJob()` helpers prevent partial job documents
- Voice note saves now write full job data (address, code, trade) instead of just captureCount

### Code review hardening (13 issues resolved)

1. **Error boundary** — app-level crash recovery screen instead of white screen
2. **Auth persistence** — `initializeAuth` with `getReactNativePersistence(AsyncStorage)` — sessions survive app restarts
3. **Exponential backoff** — queue retries with jitter (1s → 2s → 4s, capped at 30s)
4. **Lazy data hooks** — split monolithic DataContext into `useJobs()`, `useCrew()`, `useInventory()` — screens only subscribe to what they need
5. **Inventory midnight rollover** — date recomputes on app foreground
6. **Audio file size validation** — rejects recordings over 25MB before upload
7. **Rate limiting** — max 2 concurrent OpenAI calls, 3s cooldown between requests
8. **Atomic writes** — `addCapture` uses `writeBatch` (capture + count increment in one operation)
9. **Structured logger** — tagged entries (`[Auth]`, `[Sync]`, `[Transcription]`) with 200-entry ring buffer
10. **Dynamic timeout** — 60s on cellular, 30s on wifi for Whisper uploads
11. **Type safety** — replaced `as any` cast with typed `RNFormDataFile` interface
12. **Instance-based sync** — `Set<string>` keyed by item ID replaces global boolean flag
13. **Entry cap** — max 50 parsed entries from AI response

### Issues resolved
- Firestore database not provisioned → created in Firebase console (Montréal region)
- `findOrCreateOrg` hanging → Firestore security rules were blocking, added `request.auth != null` rule
- Voice note "Add all to job" showing "Not signed in" → `orgId` null during async org resolution, added `orgLoading` state with proper guards
- Voice note save button spinning forever → `batch.update()` on non-existent job doc, switched to `batch.set()` with `merge: true`
- Blank job card on home screen → voice note save created partial job doc, now writes full job data
- Google Sign-In not working on web → added `signInWithPopup` fallback with platform detection
- `getReactNativePersistence` TypeScript error → `// @ts-ignore` on import (known Firebase JS SDK typing gap)

### Architecture changes
- `DataProvider` context removed — replaced by standalone hooks that manage their own Firestore listeners
- `useData()` kept as convenience wrapper but no screen uses it directly
- New files: `src/components/ErrorBoundary.tsx`, `src/services/logger.ts`
- Navigation types extended with `estimateMode`, `voiceLineItems`, `VoiceLineItem`

### What's not yet built
- Photo capture (button exists, no flow)
- Time + Parts capture (button exists, no flow)
- Flag Issue capture (button exists, no flow)
- SendNote (UI is static, no backend)
- Signature pad on FinishJob
- Clock-in flow (QR code / geofence)
- Job timer (travel + site clock)

---

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
