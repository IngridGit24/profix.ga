// Minimal HTTP healthcheck for the distroless runtime image — same
// reasoning as backend/docker-healthcheck.mjs: no shell, curl, or wget
// available in gcr.io/distroless/nodejs20-debian12.
import http from 'node:http';

const req = http.get(`http://127.0.0.1:${process.env.PORT || 8080}/`, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});
req.on('error', () => process.exit(1));
req.setTimeout(3000, () => {
  req.destroy();
  process.exit(1);
});
