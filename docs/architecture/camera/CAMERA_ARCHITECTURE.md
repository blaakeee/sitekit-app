# Camera Capture — Architecture Reference

**Feature:** Photo capture for proof-of-work and AI quote input  
**App:** SiteKit (React Native, Expo SDK 56, managed workflow)  
**Status:** v1 in development  
**Last updated:** 2026-06-28  

> This document records final decisions. Do not re-evaluate them mid-session.  
> If something seems wrong, add a `// TODO: ARCH QUESTION` comment and continue.  
> Update this document when decisions change — not to reflect implementation details.

---

## What this feature does

Photos in SiteKit serve two distinct purposes:

**1. Proof-of-work** (primary, v1)  
Before/after pairs attached to a job and embedded in the invoice. The worker shoots a "before" photo at job start and an "after" photo on completion. The "after" capture screen shows a ghost overlay of the "before" image at ~30% opacity so the worker can frame a matching angle. Both photos must carry structured metadata: `jobId`, `tag` ('before' | 'during' | 'after'), GPS coordinates, timestamp.

**2. AI quote input** (secondary, v1 stub)  
Worker describes a job verbally and takes photos. AI suggests a quote based on job description + photos + historical job data. No overlay needed. Implemented as a `mode` prop on CameraScreen — stub in v1, fully built in a later session.

---

## Decisions (do not re-litigate)

### Storage: Cloudflare R2 via presigned direct upload

Photos never pass through the Railway/Node server. The flow is:

1. App requests a presigned URL from `POST /api/photos/presign`
2. App uploads directly from device to R2
3. App confirms success to Node server
4. Node server records `storageKey` in Postgres

**Why R2:** Zero egress fees (vs $0.09/GB on S3). Photos are read frequently — embedded in invoices, displayed in job history, shown in portfolio. Egress is the dominant cost for this pattern, not storage. Backblaze B2 + Cloudflare is cheaper on pure storage but R2 is simpler operationally for v1.

**Postgres never stores image bytes.** Only `storageKey` (a short string like `jobs/8821/after-web.jpg`).

---

### Sizes: web-sized in v1, renditions generated at upload

**v1 stored sizes (all JPEG):**

| Rendition | Long edge | Quality | Approx size | Use |
|-----------|-----------|---------|-------------|-----|
| thumb     | 200px     | 60      | ~15–30 KB   | Grid views, job lists |
| display   | 800px     | 75      | ~80–150 KB  | In-app full view |
| web       | 2000px    | 75      | ~400–600 KB | Invoice embeds, download |

Portfolio-resolution originals are deferred to v2. Renditions are generated on-device at capture time using `expo-image-manipulator` before upload. Three separate R2 keys per photo.

**Why web-sized only in v1:** One before/after pair per job × ~22 jobs/month = ~530 photos/month per business. At 0.5 MB average that's ~3.2 GB/year per business — pennies on R2. The complexity of storing and serving originals is not worth it until portfolio is a shipped feature.

---

### Camera implementation: expo-camera primary, expo-image-picker fallback

**Primary:** `expo-camera` (`CameraView`) renders the live preview inside the app. This is required for the ghost overlay, metadata-at-capture, and in-app UX consistency.

**Fallback:** `expo-image-picker` (`launchCameraAsync`) opens the OEM camera app. Used only when CameraView fails or is detected as unreliable on the device. The OEM camera app is hand-tuned for the device's sensor and handles LEGACY hardware correctly.

**This is not two co-equal cameras.** The fallback is a silent escape hatch, not a parallel implementation. No adapter pattern — one encapsulated module, one internal routing decision.

---

### Hardware detection: runtime probe, not API query

Android grades camera hardware as `LEGACY < LIMITED < FULL < LEVEL_3`. Budget phones (Samsung A-series, Motorola G-series common among field workers) are frequently `LEGACY`, causing CameraX (what expo-camera runs on) to enter compatibility mode: stretched previews, wrong rotation, laggy shutter.

The Camera2 hardware level is a native Android API not exposed to JS by expo-camera. **Do not attempt to read it directly.**

**Instead, use a runtime probe on first camera use:**

1. Attempt to mount a hidden `CameraView`
2. Call `getSupportedRatiosAsync()` with a 3-second timeout
3. If it throws, times out, or returns only `['4:3']` → classify as `'fallback'`
4. Otherwise → classify as `'full'`
5. Persist result in AsyncStorage as `camera_capability: 'full' | 'fallback'`
6. Log `Device.manufacturer`, `Device.modelName`, probe result, and timestamp as a telemetry entry

Probe runs **once per install**. Result is read from AsyncStorage on every subsequent launch — no re-probe unless explicitly reset.

**On `'fallback'` classification:**
- Show a one-time dismissable banner (persisted, never shows again after dismiss)
- Route all captures through `launchCameraAsync()`
- Ghost overlay is silently omitted — not surfaced as an error
- Telemetry entry is written so you accumulate a real-world device compatibility map

---

## The capture pipeline

Every photo goes through this exact sequence. No step is optional. No step may be skipped for performance.

```
[1] CAPTURE
    CameraView.takePictureAsync() → cache URI   (primary path)
    ImagePicker.launchCameraAsync() → temp URI  (fallback path)
         ↓
[2] COPY OUT OF CACHE (immediately)
    FileSystem.copyAsync() → documentDirectory
    Cache can be OS-purged at any time — do not hand cache URIs 
    to call sites or the upload queue
         ↓
[3] ROTATION CORRECTION
    Read exif Orientation field
    Apply rotation via expo-image-manipulator BEFORE any resize
    Some Android devices rotate pixels via exif flag rather than 
    physically rotating — missing this produces upside-down photos 
    on invoices
         ↓
[4] DOWNSCALE TO WEB SIZE
    expo-image-manipulator: long edge 2000px, JPEG quality 75
         ↓
[5] GENERATE RENDITIONS (from the web-sized corrected image)
    thumb:   long edge 200px, quality 60
    display: long edge 800px, quality 75
    All written to documentDirectory alongside the web original
         ↓
[6] BUILD NORMALIZED PHOTO OBJECT
    (see shape below — this is the only shape call sites ever see)
         ↓
[7] ADD TO UPLOAD QUEUE
    AsyncStorage key: upload_queue
    Entry includes: localUri (all 3 sizes), target R2 keys, 
    jobId, tag, retryCount: 0
    Queue drains in background — do not block UI on upload
         ↓
[8] RETURN normalized object immediately
    UI shows the photo without waiting for upload confirmation
```

---

## Normalized photo object

This is the **only shape** the rest of the app ever sees. Call sites never touch raw camera output.

```typescript
interface NormalizedPhoto {
  localUri: string;          // documentDirectory path (web-sized, durable)
  thumbUri: string;          // documentDirectory path (thumb rendition)
  displayUri: string;        // documentDirectory path (display rendition)
  width: number;
  height: number;
  takenAt: string;           // ISO8601, device local time
  gps: { lat: number; lng: number } | null;
  format: 'jpeg';
  capturedBy: 'cameraview' | 'imagepicker';
  jobId: string;
  tag: 'before' | 'during' | 'after';
}
```

**Rules:**
- `localUri` always points to `documentDirectory`, never cache
- Rotation is always already applied — consumers never need to read exif
- `gps` is `null` if location permission was not granted or GPS fix was unavailable — never throw on missing GPS
- `format` is always `'jpeg'` — HEIC/AVIF from image-picker is converted in step 4
- `capturedBy` is used for telemetry only, not for UI branching

---

## Before/after ghost overlay

Rendered only when **all** of the following are true:

- `camera_capability === 'full'`
- `tag === 'after'`
- A `'before'` photo exists in local state for the same `jobId`

Implementation: `<Image>` at `opacity={0.3}`, `position: 'absolute'`, `pointerEvents: 'none'`, covering the full `CameraView`. Include a toggle button (eye icon) to show/hide — some workers find it distracting once they have the angle. Default: visible.

Do not render a placeholder when conditions are not met. The overlay is additive — its absence changes nothing about the capture flow.

---

## Permissions

Single permission: `CAMERA` only.

- Request on first capture attempt, not at app launch
- Use `useCameraPermissions()` hook from expo-camera
- Handle three states:
  - Not yet asked → request
  - Granted → proceed
  - Denied (including permanent) → show non-blocking inline message with link to device Settings. No Alert, no modal, no blocking UI.

`expo-image-picker` fallback uses the same CAMERA permission — no additional permission prompt on the fallback path.

Location (`expo-location`) is requested separately, opportunistically. If not granted, `gps` is `null` in the normalized object. Never block capture on missing location permission.

---

## CameraView lifecycle rules

Violations of these rules cause production bugs that are hard to reproduce (session not releasing, black preview on return, "camera in use" errors):

1. **Mount only when focused.** Use `useFocusEffect` with cleanup return to unmount on blur. Do not rely on component unmount alone.

2. **Use `active={false}` to pause without unmounting** — e.g. during shutter animation, during retake preview.

3. **Handle AppState.** Pause session (`active={false}`) on `'background'`, resume on `'active'`. A phone call mid-capture must not leave a dangling session.

4. **One preview at a time.** Never render two `CameraView` components simultaneously. The probe (hardware detection) must complete and unmount before the capture screen mounts.

5. **Wrap `takePictureAsync` in try/catch.** On throw:
   - If `camera_capability` is already `'fallback'`: surface an error toast
   - If `camera_capability` is `'full'`: downgrade silently for this session, log device info + error, update AsyncStorage to `'fallback'`, retry via `launchCameraAsync()`

---

## Shutter UX

- Haptic feedback on shutter tap: `expo-haptics`, `ImpactFeedbackStyle.Medium`
- `animateShutter` prop enabled on CameraView
- Post-capture: show the just-taken photo for **1.5 seconds** before returning to live view. Worker verifies the shot in context without a separate review screen.
- "Retake" available during the 1.5s preview (discards the captured file, returns to live view immediately)
- On confirm (or timeout): if `tag === 'before'`, prompt for `'after'`; if `tag === 'after'`, show pair summary

---

## File structure

```
src/features/camera/
  useDeviceCapability.ts    — probe, AsyncStorage persistence, telemetry
  useCameraPermission.ts    — single permission hook, all state handling
  normalizePhoto.ts         — rotation correction, resize, renditions, 
                              returns NormalizedPhoto
  uploadQueue.ts            — add to queue, background drain, retry logic
  CameraScreen.tsx          — full capture screen: CameraView + overlay + 
                              shutter UX + fallback routing
  CapabilityBanner.tsx      — one-time dismissable warning for fallback devices
  index.ts                  — public API: export capturePhoto(opts) only.
                              Nothing else is exported from this feature.
```

**`index.ts` exports one thing:**

```typescript
capturePhoto(opts: {
  jobId: string;
  tag: 'before' | 'during' | 'after';
  beforePhotoUri?: string;   // required when tag === 'after' and overlay desired
}): Promise<NormalizedPhoto>
```

Call sites import `capturePhoto` only. No camera internals leak outside `src/features/camera/`.

---

## What is explicitly out of scope for v1

| Item | Deferred to |
|------|-------------|
| Portfolio-resolution originals | v2 |
| AI quote photo flow (`mode: 'quote'`) | Separate session after proof flow ships |
| R2 presigned URL integration | Separate session (uploadQueue stubs with log) |
| Video capture | Not planned |
| Front camera | Not planned (trades context is always rear camera) |
| Barcode scanning | Future session (CameraView supports it natively — no new dependency needed) |

---

## Known device issues

| Device class | Symptom | Mitigation |
|---|---|---|
| Android LEGACY HAL | Stretched preview, wrong rotation, laggy shutter | Runtime probe → fallback path |
| Budget Android (low RAM) | OOM on high-res capture | Always use `uri` not `base64`; downscale immediately |
| Any Android | Activity destroyed while OEM camera open | `getPendingResultAsync()` on relaunch (image-picker path only) |
| HEIC/AVIF output (some OEM cameras) | Format incompatible with web display | Force JPEG in step 4 of pipeline |

---

## Dependencies

| Package | Purpose | Notes |
|---|---|---|
| `expo-camera` | CameraView, primary capture | Config plugin required (CNG) — still managed workflow, not ejected |
| `expo-image-picker` | launchCameraAsync fallback | Already in most Expo projects |
| `expo-image-manipulator` | Rotation correction, resize, renditions | Do not use sharp or any Node-side library |
| `expo-file-system` | Copy out of cache, write renditions | |
| `expo-location` | GPS metadata | Opportunistic — never block on it |
| `expo-haptics` | Shutter feedback | |
| `expo-device` | Telemetry: manufacturer, modelName | |
| `@react-native-async-storage/async-storage` | Capability flag, upload queue, banner dismissed state | |

Check `package.json` before installing any of these — several are likely already present.

---

## Telemetry events (written to local log, future: send to backend)

| Event | Fields |
|---|---|
| `camera_probe_complete` | manufacturer, modelName, capability, ratiosReturned, probeMs, timestamp |
| `capture_fallback_triggered` | manufacturer, modelName, errorMessage, jobId, tag, timestamp |
| `capability_banner_dismissed` | timestamp |

Local log format: append-only JSON lines in `documentDirectory/telemetry.jsonl`. Backend ingestion is a future session.
