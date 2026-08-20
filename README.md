# ProFixGabon

Monorepo: `https://github.com/Supadanoiko/ProFixGabon`.

- `backend/` — Node/Express/MySQL API (`api-profixgabon`). See `backend/README.md`.
- `frontend/` — Vite/React SPA. Talks to the backend via `VITE_API_BASE_URL`.

Both were previously separate repositories, merged here via `git subtree`
(2026-08-20) so history stays intact under each folder. The old frontend
(pre-migration, Firebase-based — what used to live at the root of this
GitHub repo) is preserved on the `legacy-firebase` branch, not on `main`.

## Docker

Both images are distroless (`gcr.io/distroless/nodejs20-debian12:nonroot`)
at runtime — no shell, no package manager, so no `curl`/`wget` healthchecks
and no nginx for the frontend. See the comments in each `Dockerfile` for
why (multi-stage builds, custom Node-only healthcheck + static-file-server
scripts).

### Backend

```sh
cd backend
docker build -t profixgabon-backend .
docker run -p 4000:4000 --env-file .env profixgabon-backend
```

Needs a real `.env` at runtime (DB_*, JWT_SECRET, CLOUDINARY_*, ... — see
`backend/.env.example`) and a reachable MySQL instance.

### Frontend

```sh
cd frontend
docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 -t profixgabon-frontend .
docker run -p 8080:8080 profixgabon-frontend
```

`VITE_API_BASE_URL` **must** be passed as `--build-arg`, not a runtime
`-e`/`--env` — Vite inlines `import.meta.env.*` into the JS bundle at
build time, so setting it only at `docker run` has no effect.
