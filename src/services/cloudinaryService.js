import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/app.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Signed upload — replaces the old frontend's unsigned upload_preset
 * (ImageUpload.jsx), which let anyone, logged in or not, upload directly
 * to the Cloudinary account with no auth, no rate limit, and no
 * server-side validation. This generates a short-lived signature for a
 * single upload; the browser still uploads the file bytes directly to
 * Cloudinary (not proxied through this server), but only after proving to
 * us it's an authenticated request.
 */
export const generateUploadSignature = (folder = 'profixgabon') => {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    const err = new Error("Cloudinary n'est pas configuré (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET manquants).");
    err.statusCode = 500;
    throw err;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, config.cloudinary.apiSecret);

  return {
    signature,
    timestamp,
    folder,
    apiKey: config.cloudinary.apiKey,
    cloudName: config.cloudinary.cloudName,
  };
};

export default { generateUploadSignature };
