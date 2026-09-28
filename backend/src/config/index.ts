import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'agriconnect_super_secret_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  modelProvider: process.env.MODEL_PROVIDER || 'development',
  uploadDir: path.resolve(process.cwd(), 'uploads'),
  nodeEnv: process.env.NODE_ENV || 'development'
};
