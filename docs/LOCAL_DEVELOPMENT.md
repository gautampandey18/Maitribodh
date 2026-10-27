# Local Development Guide

This guide covers the local Windows/PowerShell workflow for the Maitribodh Access Management System (MAMS). The API uses PostgreSQL database `postgres` and application schema `mams`. The UI calls the API through the Vite proxy.

## Prerequisites

- Node.js 22 or newer and npm.
- PostgreSQL 16 running locally on `127.0.0.1:5432`.
- PostgreSQL role `postgres` and its password.
- PowerShell opened in the repository root, for example `C:\Project\Maitribodh-AMS\Maitribodh`.

Check Node/npm and PostgreSQL client availability:

```powershell
node --version
npm --version
psql --version
```

If PostgreSQL is stopped, start its Windows service from Services (`services.msc`) or the PostgreSQL application. The service name varies by installation. Verify connectivity by running the local DB task from `Maitribodh-API`:

```powershell
npm run db:connect:local
```

Enter the password at the prompt; do not put it in the command line. At the `psql` prompt, `\conninfo` displays the connection and `\q` exits.

## First-Time Setup

Install the locked dependencies from each project directory:

```powershell
cd .\Maitribodh-API
npm ci
cd ..\Maitribodh-UI
npm ci
```

Apply migrations from `Maitribodh-API`. This npm command calls a local PowerShell helper that prompts for the DB password without echoing it and clears the temporary connection variable afterward:

```powershell
npm run migrate:local
```

Migration `0007_require_person_photo.sql` requires photos on new person registrations; existing photo-less records are retained so Security can capture a photo at first check-in. Photos must be JPG/PNG and no larger than 2 MB. Run migrations before restarting the API.

The current migration set also normalizes existing Indian primary person mobile numbers to E.164 and removes the legacy category overstay-cutoff and permission-level assignment fields. Visitor registration accepts valid international primary mobile numbers; other person categories require an Indian primary number. Review [MAMS_DATABASE_AND_API_REFERENCE.md](./MAMS_DATABASE_AND_API_REFERENCE.md) for the full migration history.

Migrations are checksum-tracked and safe to rerun: already-applied migrations are skipped, and changed applied migrations cause an error. They create/update the `mams` schema and include the registration categories/master data.

### Optional Development Fixtures

For a disposable local database with no existing application users or operational/custom data, seed synthetic development fixtures:

Run from `Maitribodh-API`:

```powershell
npm run seed:dev:local
```

The script prompts for the database password and a strong Super Admin bootstrap password (10+ characters, with at least one letter and digit). Both prompts are masked. It stores a bcrypt hash, and the initial password expires after 24 hours and requires a password change at first sign-in.

This seed is intentionally one-time. If it reports `Development fixtures already exist`, the seed marker is already present and no rows were changed. If it reports that core/custom data exists, do not delete data just to make the seed run; use the existing database or follow the reset section only when you deliberately want to discard the local MAMS data.

Optional mockup role accounts can be added after the development seed:

Run from `Maitribodh-API`:

```powershell
npm run seed:demo-users:local
```

This prompts for the database password and one shared strong demo password. Each account requires a password change on first login. This helper refuses duplicate/partial demo accounts. Do not use development/demo seeds in shared or production databases.

## Start the API and UI

Use two separate PowerShell terminals, each opened in its project directory.

Terminal 1, from `Maitribodh-API`, start the API on port 6200:
```powershell
npm run dev:local
```

Enter the PostgreSQL password at the masked prompt. The script creates temporary local JWT/QR secrets and clears them when stopped. Restarting it invalidates existing login sessions; sign in again after a restart. Leave this terminal running.

Terminal 2, from `Maitribodh-UI`, start Vite:

```powershell
npm run dev
```

Open <http://localhost:5173/>. Vite proxies `/api` requests to `http://127.0.0.1:6200`. If port 5173 is already occupied, stop the existing UI process or start another port:

```powershell
npm run dev:5174
```

The API script supports a matching UI origin if needed, for example `-UiOrigin 'http://localhost:5174'`.

Check the API health endpoint in another terminal:

```powershell
Invoke-RestMethod http://localhost:6200/health
```

Expected response: `status : ok`. Confirm that both UI and API ports match before troubleshooting browser/API failures.

## Build, Tests, and Lint

Run these from the corresponding project directory. API commands:

```powershell
npm test
npm run lint
```

UI commands:

```powershell

npm test
npm run lint
npm run build
```

## Reset Local MAMS Data

**Destructive:** this permanently removes all tables and data in schema `mams`, including users, registrations, visits, audit records, fixtures, and category/master data. Continue only for a disposable local database after confirming the target is `127.0.0.1:5432`, database `postgres`. Do not run this against shared, staging, or production databases.

1. Stop the API with `Ctrl+C` in its terminal. Stop other local tools that are writing to this database.
2. Optional but recommended: create a full database backup. Run from the API directory; `pg_dump` prompts for the password:

    From `Maitribodh-API`, run the backup task; `pg_dump` prompts for the DB password and writes the dump under the OS temp directory:

    ```powershell
    npm run db:backup:local
    ```

3. Connect to the explicitly local database and verify the target before deleting anything:

    Run `npm run db:connect:local` from `Maitribodh-API` and enter the password at the prompt.

    At the `psql` prompt, run `\conninfo`. Continue only if it confirms the expected local host and `postgres` database. Exit with `\q`, then run the guarded reset task from `Maitribodh-API`:

    ```powershell
    npm run db:reset:local
   ```

    It asks you to type `RESET LOCAL MAMS DATA` before deleting anything. The task connects only to `127.0.0.1:5432`, database `postgres`, and does not drop that entire database.

4. Reapply migrations using the password-masked command in First-Time Setup.
5. If you want synthetic fixtures, run `seed_dev.ps1`; optionally run `seed_demo_users.ps1` after it. A fresh reset removes the prior seed marker.
6. Start the API and UI using the commands above.

The reset removes database records only. It does not remove private uploaded files under the API's `private-uploads` directory. Review and remove those files manually only if you also intend to discard local uploads. Do not remove the directory if you need to retain those files.
