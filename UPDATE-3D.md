# Nivas — 3D workspace update

## What changed

- Login remains the approved midnight-blue experience with role-specific Student, Warden, and Admin scenes.
- Every signed-in dashboard now begins with a colorful 3D welcome scene and role-specific quick activities.
- Student, Warden, and Admin use different accent colors and 3D models throughout the workspace.
- Activity pages have raised color-coded headings, colorful controls, softer card surfaces, and entrance animation.
- Desktop sidebar navigation, mobile activity drawer, and mobile bottom navigation match the active role.
- Existing light/dark theme support is preserved.
- Motion on/off control and system reduced-motion support are shared across login and workspace.
- Three.js rendering is capped and pauses when the page is hidden or the scene is off-screen.
- WebGL fallback keeps the app usable on devices that cannot render the decorative scene.
- Existing Firebase authentication, data collections, calls, and business actions were preserved.

## Files changed or added

- `src/pages/Login.jsx`
- `src/components/Layout.jsx`
- `src/components/PortalDashboardHeader.jsx` (new)
- `src/components/3d/Hostel3DCanvas.jsx`
- `src/components/3d/SplashScreen3D.jsx`
- `src/components/scenes/StudentScene.js`
- `src/components/scenes/AdminScene.js`
- `src/main.jsx`
- `src/nivas-3d.css`
- `src/nivas-workspace.css` (new)
- `src/components/ResetPasswordDialog.jsx` (new)
- `src/hooks/useMotionPreference.js` (new)

The archive contains the rest of the original Nivas project. Keep your existing Firebase environment settings. No package changes are required.

## Run locally

```sh
npm ci
npm run dev
```

For a production build:

```sh
npm run build
```

## Validation

The production build passed. Lint completed with warnings from pre-existing unused variables/imports in the original project. The build reports a size advisory for the Three.js vendor chunk. Live Firebase operations, calls, PWA installation, and real-device visual checks were not performed. This update has not been pushed to GitHub or deployed to Vercel.
