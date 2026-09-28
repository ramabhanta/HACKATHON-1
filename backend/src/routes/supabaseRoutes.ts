import { Router, Request, Response } from 'express';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  syncLocalDataToSupabase,
  saveSupabaseConfig
} from '../database/supabaseClient.js';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';

export const supabaseRouter = Router();

// 1. Get Supabase Connection Status
supabaseRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const configured = isSupabaseConfigured();
    const testResult = configured ? await testSupabaseConnection() : null;

    return res.json({
      configured,
      url: config.supabaseUrl ? config.supabaseUrl.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : '',
      connected: testResult?.connected || false,
      message: testResult?.message || (configured ? 'Ready to connect' : 'Supabase credentials not configured yet'),
      tableCounts: testResult?.tableCounts || {}
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Test Connection
supabaseRouter.post('/test', async (_req: Request, res: Response) => {
  try {
    const result = await testSupabaseConnection();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Save Supabase Configuration
supabaseRouter.post('/config', async (req: Request, res: Response) => {
  try {
    const { url, anonKey, serviceKey } = req.body;
    if (!url || !anonKey) {
      return res.status(400).json({ error: 'URL and Anon Key are required' });
    }

    saveSupabaseConfig(url.trim(), anonKey.trim(), serviceKey ? serviceKey.trim() : undefined);
    const testResult = await testSupabaseConnection();

    return res.json({
      success: true,
      message: 'Supabase configuration saved.',
      testResult
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Sync Local Data to Supabase
supabaseRouter.post('/sync', async (_req: Request, res: Response) => {
  try {
    const result = await syncLocalDataToSupabase();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Get SQL Schema DDL text for one-click copy
supabaseRouter.get('/schema', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'src', 'database', 'supabase_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      return res.type('text/plain').send(sql);
    }
    return res.status(404).json({ error: 'Schema file not found' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
