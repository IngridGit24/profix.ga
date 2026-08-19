# profixgabon frontend — Vite/React SPA.
#
# Multi-stage: the build needs a full Node image (shell, npm, vite) but the
# runtime image is distroless (gcr.io/distroless/nodejs20-debian12) — no
# shell, no package manager, so no nginx either. docker-static-server.mjs
# (plain Node, no deps) serves the built ./dist instead — see its comment.
#
# VITE_API_BASE_URL is inlined into the JS bundle at BUILD time by Vite
# (import.meta.env.*), not read at container startup — pass it as a
# --build-arg, not a runtime -e/environment variable.

# ---- build stage ---------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---- runtime stage --------------------------------------------------------
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runtime
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY docker-static-server.mjs ./
COPY docker-healthcheck.mjs ./

ENV PORT=8080
EXPOSE 8080

# Already the default user on the :nonroot tag (uid 65532) — set
# explicitly so it's self-documenting rather than implicit.
USER nonroot

# HEALTHCHECK's CMD runs directly, not through the image's ENTRYPOINT, so
# it needs the node binary's full path.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/nodejs/bin/node", "docker-healthcheck.mjs"]

# The image's ENTRYPOINT is already ["/nodejs/bin/node"] — this just
# supplies its argument.
CMD ["docker-static-server.mjs"]
