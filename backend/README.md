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

## What's NOT done yet — read before assuming this is deployable

1. **The frontend hasn't been migrated.** Every Firestore/Firebase Auth
   call in `profixgabon/src/services/*.js`, `context/AuthContext.jsx`,
   `components/ProtectedRoute.jsx`, and the pages themselves still talks
   to Firebase directly. This backend exists and is tested independently,
   but nothing in the frontend calls it yet — that's the next phase.
2. **Existing users can't be migrated with their passwords.** Firebase
   Auth never exposes usable password hashes for export in the general
   case. The plan baked into the schema: migrate `users` by `firebase_uid`
   with `password = NULL`, and any such account must go through
   `POST /auth/request-password-reset` → `/auth/reset-password` before
   their first login here. **No migration script exists yet** — this
   needs a one-off script reading from the Firestore export and inserting
   into MySQL, which isn't written.
3. **Password reset emails aren't sent.** `requestPasswordReset` generates
   and stores a token but only logs it (see the `TODO` in
   `authController.js`) — no SMTP is wired up.
4. **No tests.** `jest`/`supertest` are installed, nothing is written yet.
5. **Firestore rules were never available to audit** (not in the frontend
   repo) — if this migration goes ahead, the old Firestore rules should be
   locked down to deny-all once the frontend cuts over, so no stale write
   path remains.

## Setup

```bash
cp .env.example .env   # fill in DB_*, JWT_SECRET, CLOUDINARY_*
npm install
npm run migrate        # creates all tables
npm run dev
```

## Structure

Mirrors `api-livrago-express`'s conventions: `routes` → `controllers` →
`services`, Joi validation, JWT auth middleware, `executeQuery`/
`executeTransaction` over a `mysql2` pool, Socket.io for real-time.
