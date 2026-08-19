# api-profixgabon — Node/Express/MySQL API.
#
# Multi-stage: `npm ci` needs a full Node image (shell, npm) but the
# runtime image is distroless (gcr.io/distroless/nodejs20-debian12) — no
# shell, no package manager, nothing but the Node binary. That's why the
# HEALTHCHECK below runs a small .mjs script via exec form instead of curl
# or wget (neither exists in the final image).

# ---- deps stage --------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- runtime stage ------------------------------------------------------
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runtime
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY docker-healthcheck.mjs ./

ENV NODE_ENV=production
EXPOSE 4000

# Already the default user on the :nonroot tag (uid 65532) — set
# explicitly so it's self-documenting rather than implicit.
USER nonroot

# HEALTHCHECK's CMD is run directly, not through the image's ENTRYPOINT,
# so it needs the node binary's full path — /nodejs/bin/node is where
# distroless nodejs images place it.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/nodejs/bin/node", "docker-healthcheck.mjs"]

# The image's ENTRYPOINT is already ["/nodejs/bin/node"] — this just
# supplies its argument.
CMD ["src/app.js"]
