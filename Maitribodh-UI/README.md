# Maitribodh Access Management System UI

React 19, Vite, Material UI and React Router PWA client.

## Local development

1. Run `npm install` to resolve and lock the dependencies.
2. By default, `/api` is proxied to `http://127.0.0.1:6200` during development. Set `VITE_API_BASE_URL` explicitly for a separately hosted production API, or configure the production host to forward `/api`.
3. Run `npm run dev` and open `http://localhost:5173`.
4. Run `npm test`, `npm run lint`, and `npm run build` before handing off changes.

The UI includes registration, person detail/edit/documents/activity, gate scanning and manual verification, QR previews, audit browsing, notifications and master lookup/category field-schema editing, alongside the existing dashboard, approvals, blacklist, reports, users and public QR pages. Screen access and landing paths use a shared role matrix. Access tokens stay in Redux memory and are not persisted to browser storage. API and database credentials must never be placed in `VITE_*` variables.

Use `npm run dev -- --port 5174` when the default port is occupied. Apply the API registration migration and restart the API before exercising the new workflows with live data. Camera permission and a supported camera device are required for real scanning. Offline gate movements must remain on the paper register; the UI does not queue or replay them.

## Security Gate QR scanning

- For live scanning, open the web app over HTTPS or on `localhost`, allow camera access for that address, and click **Start camera scan**. A phone rear camera is preferred; a desktop webcam also works. HTTP LAN addresses cannot access the live camera.
- **Upload QR image** accepts a clear JPEG or PNG of the QR code without requiring camera permission. Phone camera capture is also offered when live scanning is unavailable.
- Camera and image decoding use Html5-QRCode, configured specifically for QR codes. Image scanning retries at multiple sizes with white padding, a central crop, rotations, and inverted contrast using that same library. For best results, use the original downloaded PNG or crop a photo around the full QR, retaining all four corners and its white border. Newly generated QR images include the standard four-module white border; signed payloads and existing QR validity are unchanged.
- USB QR readers can enter the signed QR text in the search field and submit with Enter. Pasted QR text follows the same verified QR lookup as camera and image scans; it is not a name search.
- A successful camera scan automatically looks up and displays the person's identity and profile photo without clicking **Find Person**. Lookup begins immediately, without waiting for camera shutdown; repeated detections of the same scan are ignored. Photo verification is still required before check-in. Invalid, replaced, blacklisted, and inactive QR/profile outcomes must not be overridden by a restricted-area warning.
- The photo-verification checkbox remains disabled while the profile photo is missing or loading. Photo request failures show an error and **Retry profile photo**. Eligible profiles without a photo offer camera capture or **Upload profile photo**, including profiles with a restricted-area warning; verification becomes available after the saved photo loads.
- A photo `404` also offers capture/upload to recover a missing stored image. The API permits guards to repair only a server-confirmed missing photo on an active non-Staff profile, not replace an existing image. Development seed records intentionally reference non-provisioned photos, so supply a real photograph before verification; no placeholder image is used to bypass this check. Blob download errors display the API message or HTTP status.
- Missing-photo recovery is also offered for people already inside; it does not permit another check-in. Missing files do not show a futile retry button. Other profile states explain that administrator recovery is required; transient request failures still offer retry.

See `../docs/MAMS_IMPLEMENTATION_STATUS.md` for incomplete requirements; the application is not yet a complete implementation of the supplied feature list.