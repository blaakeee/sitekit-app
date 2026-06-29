# Camera Capture — Session Prompt
## Session: v1 Initial Build

**Before writing any code, read this file in full, then read:**  
`docs/architecture/camera/CAMERA_ARCHITECTURE.md`

All decisions in the architecture doc are final for this session.  
Do not re-evaluate them. If something seems wrong or unclear, add a  
`// TODO: ARCH QUESTION — <your question>` comment and keep moving.

---

## Platform constraints (critical)

- Expo SDK 56, managed workflow. Do NOT eject.
- Do NOT install global npm packages.
- Before using any Expo camera, filesystem, or image API: check the  
  **Expo SDK 56 docs** first. APIs change across SDK versions — do not  
  assume behavior from training data.
- TypeScript throughout. No `any`.
- All async operations must have error boundaries. No unhandled promise rejections.

---

## What to build this session

Deliver all files under `src/features/camera/` as specified in the  
architecture doc. The full list:

```
src/features/camera/
  useDeviceCapability.ts
  useCameraPermission.ts
  normalizePhoto.ts
  uploadQueue.ts
  CameraScreen.tsx
  CapabilityBanner.tsx
  index.ts
```

Build each file completely. No placeholders except where this prompt  
explicitly says to stub.

---

## Explicit stubs for this session

**`uploadQueue.ts` — upload drain only:**  
The queue add/persist logic must be fully built (add entry, write to  
AsyncStorage, retry count). The actual upload call should log:  
```
console.log('UPLOAD STUB:', key, localUri)
```  
and resolve immediately. The presigned R2 integration is a separate  
session. The stub must have the same function signature and return type  
as the real implementation will — callers must not need to change.

**`CameraScreen.tsx` — `mode: 'quote'` only:**  
The `mode` prop must exist and be typed. When `mode === 'quote'`, render:  
```tsx
// TODO: AI quote photo flow — separate session
<View><Text>Quote capture coming soon</Text></View>
```  
Implement `mode === 'proof'` fully.

---

## Before/after overlay — implementation detail

The `beforePhotoUri` passed to `capturePhoto()` is the `localUri` from  
the 'before' NormalizedPhoto (a `file://` path in documentDirectory).  
Use this directly as the `<Image>` source — no network request needed.

The toggle button for the overlay should use an eye / eye-off icon.  
Use `@expo/vector-icons` (already in the project) rather than adding  
a new icon library.

---

## GPS implementation detail

Request location permission with `expo-location` using  
`requestForegroundPermissionsAsync()`. If granted, call  
`getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })`.  
Wrap in try/catch with a 5-second timeout — GPS fix may be slow or  
unavailable indoors. On any failure: set `gps: null` and continue.  
Never throw on missing GPS.

---

## Upload queue key format

R2 storage keys follow this pattern:

```
jobs/{jobId}/{tag}-{rendition}-{timestamp}.jpg
```

Examples:
```
jobs/8821/before-web-1719532800000.jpg
jobs/8821/before-thumb-1719532800000.jpg
jobs/8821/before-display-1719532800000.jpg
```

`timestamp` is `Date.now()` at capture time, taken from the normalized  
photo's `takenAt` field converted to Unix ms. This ensures uniqueness  
and gives a natural sort order.

---

## Rotation correction — implementation detail

Read `exif.Orientation` from the raw capture result. The mapping:

| Orientation value | Rotation to apply |
|---|---|
| 1 (or undefined) | 0° — no rotation needed |
| 3 | 180° |
| 6 | 90° clockwise |
| 8 | 90° counter-clockwise |

Apply using `expo-image-manipulator`'s `rotate` action before any  
resize action in the same `manipulateAsync` call. If `exif` is null  
or `Orientation` is absent, apply 0° rotation (no-op).

---

## AsyncStorage keys used by this feature

Document these in a constants object at the top of the relevant file,  
not scattered as magic strings:

```typescript
const CAMERA_STORAGE_KEYS = {
  CAPABILITY: 'camera_capability',
  BANNER_DISMISSED: 'camera_banner_dismissed',
  UPLOAD_QUEUE: 'upload_queue',
  TELEMETRY_LOG: 'telemetry_log_path',  // stores path to .jsonl file
} as const;
```

---

## Capability banner copy

Exact text for the one-time warning shown on fallback devices:

> **Your camera has limited compatibility**  
> We've switched to your phone's built-in camera for the best results.  
> Framing guides won't be available on this device.

Dismiss button label: **Got it**

Style: non-blocking, appears below the app header, does not cover the  
camera view. Amber/warning color. Dismisses with a short fade animation.

---

## What NOT to build this session

| Item | Reason |
|---|---|
| R2 presigned URL call | Separate session |
| `mode === 'quote'` implementation | Separate session |
| Job selection / jobId input UI | Comes from navigation params — assume it's passed in |
| Invoice embed of photos | Separate feature |
| Telemetry backend ingestion | Future session — write to local `.jsonl` only |
| Any UI outside `src/features/camera/` | This session is the camera module only |

---

## Acceptance checklist

Before considering this session complete, verify:

- [ ] `src/features/camera/index.ts` exports `capturePhoto` and nothing else
- [ ] `capturePhoto` returns a `NormalizedPhoto` — no raw camera types leak out
- [ ] Hardware probe runs once, result persists across app restarts
- [ ] Capability banner appears on first launch after a 'fallback' probe result and never again after dismiss
- [ ] `useFocusEffect` is used to mount/unmount `CameraView` — not just component lifecycle
- [ ] `AppState` handler pauses/resumes camera session on background/foreground
- [ ] `takePictureAsync` failure on a 'full' device silently downgrades to `launchCameraAsync` and updates AsyncStorage
- [ ] All captured files are in `documentDirectory` before the normalized object is returned — no cache URIs in the output
- [ ] Rotation is corrected before resize in the manipulator chain
- [ ] Three renditions (web, display, thumb) are generated and their URIs are in the normalized object
- [ ] Upload queue entries are written to AsyncStorage with correct R2 key format
- [ ] `gps: null` when location is unavailable — no throw
- [ ] `mode === 'quote'` renders the stub without crashing
- [ ] No `any` in TypeScript
- [ ] No unhandled promise rejections

---

## After this session

Update `docs/architecture/camera/CAMERA_ARCHITECTURE.md`:
- Note any `TODO: ARCH QUESTION` items found during implementation
- Add any new device-specific issues discovered
- Update the "Known device issues" table if anything surfaced during testing

Next planned sessions for this feature:
1. R2 presigned upload integration (uploadQueue drain implementation)
2. AI quote photo flow (`mode === 'quote'`)
3. Telemetry backend ingestion
