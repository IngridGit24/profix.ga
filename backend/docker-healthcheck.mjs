// Minimal HTTP healthcheck for the distroless runtime image — there's no
// shell, curl, or wget in gcr.io/distroless/nodejs20-debian12, so Docker's
// HEALTHCHECK runs this instead (exec form, no shell involved either).
import http from 'node:http';

const req = http.get(`http://127.0.0.1:${process.env.PORT || 4000}/health`, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});
req.on('error', () => process.exit(1));
req.setTimeout(3000, () => {
  req.destroy();
  process.exit(1);
});
