import { generateUploadSignature } from '../services/cloudinaryService.js';
import { ApiResponse } from '../types/index.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

class UploadController {
  getSignature = asyncHandler(async (req, res) => {
    const folder = req.query.folder === 'identite' ? 'profixgabon/identite' : 'profixgabon/general';
    const data = generateUploadSignature(folder);
    res.json(ApiResponse.success(data, 'Signature générée avec succès'));
  });
}

export default new UploadController();
