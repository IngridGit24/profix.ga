# ProFixGabon API

Node.js + Express + MySQL backend for ProFixGabon, replacing direct
Firestore/Firebase Auth access from the React frontend. Built to fix
specific issues found in a state analysis of the existing app — see
"Why this exists" below before changing the security-sensitive parts.

## Why this exists

The frontend (`profixgabon/`) talked directly to Firebase from the browser
for everything. Two things this backend fixes, concretely:

1. **The admin panel had no real access control.** `AdminPage.jsx` gated
   itself with a hardcoded email (`ADMIN_EMAIL`) checked entirely in
   client-side JavaScript. The actual `updateDoc`/`deleteDoc` calls it
   guarded were reachable directly from the browser console by anyone
   authenticated, regardless of what the UI redirected to. Here,
   `POST /prestataires/:id/validate` and `/reject` are gated by
   `authorizeRoles('admin')`, checked server-side against a real JWT.
2. **"Rate limiting" was a plain in-memory object in the browser tab** —
   reset by a page refresh. `loginLockout.js` here is the real,
   server-enforced version.

Also fixed along the way (see `services/devisService.js`):
- Quote numbering was a `getDocs().then(count => ...)` race — two
  concurrent quotes could get the same number. Now atomic via MySQL's
  `LAST_INSERT_ID(expr)` idiom.
- Quote expiration was computed with `serverTimestamp(new Date(...))` —
  `serverTimestamp()` takes no arguments, so the date was silently
  ignored and every quote "expired" immediately. Now computed correctly.
- Unsigned Cloudinary uploads (anyone, logged in or not, could upload
  directly to the account) replaced with signed, authenticated uploads —
  see `GET /api/v1/uploads/signature`.

## What's implemented

- Auth: register/login/JWT, profile update, password change, mode
  switching (client ⇄ prestataire dashboards).
- Prestataires: public browse/detail, provider application, owner-only
  profile edit/availability toggle, **admin validate/reject** (the
  critical fix above).
- Demandes (quote requests) and Devis (quotes): create, list, respond —
  with the atomic numbering and correct expiration date.
- Real-time messaging (conversations + messages) over Socket.io, replacing
  Firestore's `onSnapshot`.
- Signed Cloudinary upload endpoint.

## Remaining work

The current frontend in `../frontend/` uses this API for authentication and
application data; it no longer imports the Firebase SDK. The former
Firebase-based frontend is preserved on the `legacy-firebase` branch.

The project still needs the following work before its migration and
production-readiness can be considered complete:

1. **Legacy account/data migration.** Firebase Auth does not generally expose
   password hashes for export. No import script exists yet. Imported accounts
   can use `password = NULL` and must reset their password before logging in.
2. **Password reset email delivery.** `requestPasswordReset` currently stores
   a token but only logs it; SMTP or another email provider is not configured.
3. **Broader automated backend tests.** A small Jest suite now covers
   conversation-participant authorization. The rest of the API still needs
   automated coverage, including authentication, providers, requests, and
   quotes.
4. **Legacy Firebase access review.** Before retiring the old application,
   audit and lock down its Firestore rules so an obsolete client cannot keep
   writing to legacy data.
5. **Production deployment.** The repository workflow builds and publishes
   Docker images; deployment to a running environment must be configured
   separately.

## Setup

```bash
cp .env.example .env   # fill in DB_*, JWT_SECRET, CLOUDINARY_*
npm install
npm run migrate        # creates all tables
npm run seed:admin     # creates/promotes admin@profix.com using ADMIN_PASSWORD
npm run dev
```

Set a strong `ADMIN_PASSWORD` in `.env` before running the admin seeder. The
password is hashed with bcrypt and is never stored in the source code.

## Structure

Mirrors `api-livrago-express`'s conventions: `routes` → `controllers` →
`services`, Joi validation, JWT auth middleware, `executeQuery`/
`executeTransaction` over a `mysql2` pool, Socket.io for real-time.
