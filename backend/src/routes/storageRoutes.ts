import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload.js';
import { uploadToStorage, isSupabaseConfigured } from '../database/supabaseClient.js';
import { optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

export const storageRouter = Router();

/**
 * Universal file upload endpoint supporting all Supabase Storage buckets
 * Buckets: 'crop-scans', 'scan-images', 'soil-reports', 'products', 'avatars', 'profiles', 'crop-images'
 */
storageRouter.post(
  '/upload',
  optionalAuthenticate,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please provide a file in multipart form-data under key "file"' });
      }

      const requestedBucket = (req.body.bucket || req.query.bucket || 'crop-scans') as any;
      const validBuckets = ['crop-scans', 'scan-images', 'soil-reports', 'products', 'avatars', 'profiles', 'crop-images'];
      const bucket = validBuckets.includes(requestedBucket) ? requestedBucket : 'crop-scans';

      const filePath = req.file.path || path.join(config.uploadDir, req.file.filename);
      let fileBuffer: Buffer | null = null;
      if (req.file.buffer) {
        fileBuffer = req.file.buffer;
      } else if (fs.existsSync(filePath)) {
        fileBuffer = fs.readFileSync(filePath);
      }

      if (!fileBuffer) {
        return res.status(500).json({ error: 'Could not read uploaded file content' });
      }

      const fileName = req.file.originalname || req.file.filename || `upload_${Date.now()}`;
      const mimeType = req.file.mimetype || 'image/jpeg';

      const publicUrl = await uploadToStorage(bucket, fileBuffer, fileName, mimeType);

      return res.status(201).json({
        success: true,
        url: publicUrl,
        publicUrl,
        bucket,
        fileName,
        size: req.file.size,
        mimeType
      });
    } catch (err: any) {
      console.error('[STORAGE ROUTE ERROR]', err);
      return res.status(500).json({ error: err.message || 'File upload failed' });
    }
  }
);
