# Nivas — 3D interface update

## What changed

- Redesigned login with a midnight-blue scene area and a clear white sign-in panel.
- Student: blue study-room scene, desk, laptop, and floating hostel activity cards.
- Warden: mint office scene, attendance register, rotating keys, and leave-approval animation.
- Admin: gold hostel model, moving network activity, and animated dashboard elements.
- Smooth, interruptible portal transitions, subtle mouse parallax, and raised button interactions.
- A short, skippable opening animation and a replay control on desktop.
- Matching 3D workspace scene in the desktop sidebar and animated dashboard panel entrances.
- Motion on/off control, system reduced-motion support, capped rendering resolution, and paused rendering when hidden or off-screen.
- WebGL fallback keeps the login form available when the decorative scene cannot render.
- Properly labelled inputs and a keyboard-accessible password-reset dialog.
- Existing development database utilities are available in development mode only.

## Files to update in your existing repository

Copy these files into the same paths in your Nivas project:

- src/pages/Login.jsx
- src/components/3d/Hostel3DCanvas.jsx
- src/components/3d/SplashScreen3D.jsx
- src/components/scenes/StudentScene.js
- src/components/scenes/AdminScene.js
- src/components/Layout.jsx
- src/main.jsx
- src/nivas-3d.css (new)
- src/components/ResetPasswordDialog.jsx (new)
- src/hooks/useMotionPreference.js (new)

The archive also contains the rest of your original project. Keep your existing Firebase environment settings when updating your working project. No package changes are required.

## Local verification

From the project folder:

```sh
npm ci
npm run dev
```

For a production build:

```sh
npm run build
```

## Validation performed

The production build passed. Targeted lint checks passed for the changed login, layout, reset dialog, motion hook, and 3D controller/splash components. The build reports a size advisory for the Three.js vendor chunk.

Live Firebase authentication, database writes, calls, mobile installation, and visual browser/device checks were not performed. This update has not been pushed to GitHub or deployed to Vercel. Existing service-worker configuration was left as supplied.
