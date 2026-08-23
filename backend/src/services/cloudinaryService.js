import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/app.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const IDENTITY_FOLDER = 'profixgabon/identite';

/**
 * Signed upload — replaces the old frontend's unsigned upload_preset
 * (ImageUpload.jsx), which let anyone, logged in or not, upload directly
 * to the Cloudinary account with no auth, no rate limit, and no
 * server-side validation. This generates a short-lived signature for a
 * single upload; the browser still uploads the file bytes directly to
 * Cloudinary (not proxied through this server), but only after proving to
 * us it's an authenticated request.
 *
 * ID documents (folder === IDENTITY_FOLDER) are uploaded with
 * `type: 'authenticated'` instead of Cloudinary's default `type: 'upload'`
 * — the latter is served publicly to anyone who has (or guesses) the URL,
 * regardless of what our own API decides to expose. `type` must be part of
 * the signed params here AND resubmitted as-is in the actual upload
 * request (see frontend/src/services/upload.js), or Cloudinary rejects the
 * signature. See getSignedIdentityUrl() below for reading these back.
 */
export const generateUploadSignature = (folder = 'profixgabon') => {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    const err = new Error("Cloudinary n'est pas configuré (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET manquants).");
    err.statusCode = 500;
    throw err;
  }

  const isIdentity = folder === IDENTITY_FOLDER;
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = isIdentity ? { timestamp, folder, type: 'authenticated' } : { timestamp, folder };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, config.cloudinary.apiSecret);

  return {
    signature,
    timestamp,
    folder,
    apiKey: config.cloudinary.apiKey,
    cloudName: config.cloudinary.cloudName,
    ...(isIdentity ? { type: 'authenticated' } : {}),
  };
};

// Matches the /v<version>/<public_id>.<ext> tail of a Cloudinary delivery
// URL, however it got prefixed (image/upload/..., image/authenticated/
// s--sig--/..., with or without transformations) — the public_id is the
// only part we actually need to re-sign a fresh URL.
const PUBLIC_ID_FROM_URL = /\/v\d+\/([^?]+)\.[a-zA-Z0-9]+(?:\?.*)?$/;

/**
 * Turns a stored `piece_identite` URL back into one that actually loads.
 * Because the asset was uploaded with type: 'authenticated' above, the raw
 * secure_url Cloudinary returned at upload time (which is what gets stored
 * in the DB — see prestataireService.js) now 401s for everyone, including
 * the owner: `type: authenticated` assets always require a fresh signed
 * URL to view, generated with our api_secret (which an outside party
 * doesn't have) — that's the actual point, closing the "URL leaked once ->
 * viewable forever by anyone" gap. Callers must only invoke this once
 * they've already decided the current viewer is authorized (owner/admin —
 * see prestataireController.js) — this function itself does no such check.
 */
export const getSignedIdentityUrl = (secureUrl) => {
  if (!secureUrl) return secureUrl;
  const match = secureUrl.match(PUBLIC_ID_FROM_URL);
  if (!match) return secureUrl; // not a recognizable Cloudinary URL — leave untouched
  return cloudinary.url(match[1], { type: 'authenticated', sign_url: true, secure: true });
};

export default { generateUploadSignature, getSignedIdentityUrl };
