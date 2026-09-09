# Nivas — interactive 3D login update

## New login experience

- Student: a rounded blue-and-white explorer robot with a graduation cap, floating book, and a tap-to-wave animation. Its eyes follow the pointer and close when a password field is focused.
- Warden: a beveled mint shield, gold key, orbit ring, and small lock. Tap to spin the key; the lock closes when a password field is focused.
- Admin: a violet command cube with raised gold/cyan tiles and orbiting nodes. Tap to push out the tiles and pulse the core.
- Drag with a mouse or swipe horizontally with a finger to rotate each model. Vertical touch scrolling and pinch zoom remain available.
- Use the visible arrow buttons or keyboard arrows to rotate, Enter/Space to animate, and R or the reset button to restore the view.
- Each form has a raised card, cursor-following light, a gentle mouse tilt, touch feedback, animated focus accents, and a dimensional sign-in button. The card remains still while typing.
- Role selectors appear above the scene on mobile. Role colors carry through the scene and form.
- The intro now uses the new admin sculpture. Motion preferences, reduced-motion support, off-screen pausing, and WebGL fallback are retained. Tap animations are disabled when motion is off; manual rotation remains available.
- The signed-in dashboards and existing sign-in, sign-up, password-reset, and role-routing handlers are unchanged from the preceding workspace update.

## Apply this update

Extract the ZIP, then copy its `Nivas-main/src` folder into the matching `src` folder in your local Nivas project, replacing files when prompted. Include the new files and folders. Commit and push those source changes using your usual GitHub workflow. No files need to be deleted, and the ZIP itself should not replace your source code.

This login revision changes or adds seven source files:

- `src/pages/Login.jsx`
- `src/main.jsx`
- `src/components/3d/SplashScreen3D.jsx`
- `src/components/3d/login/InteractiveLoginWorld.jsx` (new)
- `src/components/3d/login/createLoginSculpture.js` (new)
- `src/components/3d/login/orbitInput.js` (new)
- `src/nivas-login-interactive.css` (new)

Keep your existing Firebase environment values and deployment configuration. No dependency changes are required. The full archive also includes the preceding dashboard improvements described below.

## Included workspace improvements

- Login uses the midnight-blue layout with the new interactive scenes above.
- Every signed-in dashboard now begins with a colorful 3D welcome scene and role-specific quick activities.
- Student, Warden, and Admin use different accent colors and 3D models throughout the workspace.
- Activity pages have raised color-coded headings, colorful controls, softer card surfaces, and entrance animation.
- Desktop sidebar navigation, mobile activity drawer, and mobile bottom navigation match the active role.
- Existing light/dark theme support is preserved.
- Motion on/off control and system reduced-motion support are shared across login and workspace.
- Three.js rendering is capped and pauses when the page is hidden or the scene is off-screen.
- WebGL fallback keeps the app usable on devices that cannot render the decorative scene.
- Existing Firebase authentication, data collections, calls, and business actions were preserved.

## Files from the preceding workspace update

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

The production build passed. Targeted lint for the new login scene modules, login page, and intro passed without warnings. Programmatic checks passed for tap/drag detection, vertical-scroll handling, secondary-pointer isolation, cancellation, rotation bounds, and reset. All three 3D models constructed and updated with finite transforms across idle, email, password, and loading states. A comparison against the preceding version confirmed the dashboards and authentication handlers were unchanged.

The build reports a size advisory for the Three.js vendor chunk (approximately 567 kB before compression). Browser rendering, physical-device gestures, live Firebase operations, calls, and PWA installation were not tested. This update has not been pushed to GitHub or deployed to Vercel.
