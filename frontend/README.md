# ProFixGabon Frontend

React 19 single-page application built with Vite. It uses the ProFixGabon
backend API for authentication and application data; Firebase SDK calls are
not used by the current frontend.

## Features

- Clients can browse providers, submit service requests, review quotes, chat
  with providers, and leave reviews.
- Providers can apply for a profile, manage their profile and availability,
  and respond to client requests.
- Administrators can review provider profiles and validate or reject them.

## Local development

Start the backend and MySQL database first; see `../backend/README.md` for
backend configuration and migrations. Then run:

```sh
npm ci
npm run dev
```

The API base URL is configured with `VITE_API_BASE_URL`. For a local backend,
create a `.env.local` file with:

```sh
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

If unset, the frontend uses that local URL by default. Vite reads this value
at build time, so a production build must be given the production API URL.

## Checks and production build

```sh
npm run lint
npm run build
```

For Docker, pass `VITE_API_BASE_URL` as a build argument; setting it only when
starting the container does not change the already-built frontend bundle.
