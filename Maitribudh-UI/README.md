# Maitribodh Access Management System UI

React 19, Vite, Material UI and React Router PWA client.

## Local development

1. Run `npm install` to resolve and lock the dependencies.
2. By default, `/api` is proxied to `http://127.0.0.1:6200` during development. Set `VITE_API_BASE_URL` explicitly for a separately hosted production API, or configure the production host to forward `/api`.
3. Run `npm run dev` and open `http://localhost:5173`.
4. Run `npm test`, `npm run lint`, and `npm run build` before handing off changes.

The UI includes registration, person detail/edit/documents/activity, gate scanning and manual verification, QR previews, audit browsing, notifications and master lookup/category field-schema editing, alongside the existing dashboard, approvals, blacklist, reports, users and public QR pages. Screen access and landing paths use a shared role matrix. Access tokens stay in Redux memory and are not persisted to browser storage. API and database credentials must never be placed in `VITE_*` variables.

Use `npm run dev -- --port 5174` when the default port is occupied. Apply the API registration migration and restart the API before exercising the new workflows with live data. Camera permission and a supported camera device are required for real scanning. Offline gate movements must remain on the paper register; the UI does not queue or replay them.

See `../docs/MAMS_IMPLEMENTATION_STATUS.md` for incomplete requirements; the application is not yet a complete implementation of the supplied feature list.