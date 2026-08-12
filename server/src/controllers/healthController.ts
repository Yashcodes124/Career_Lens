import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/db.js';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const dbConnected = await checkDatabaseConnection();

  res.status(200).json({
    status: 'ok',
    service: 'truehire-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbConnected,
      status: dbConnected ? 'healthy' : 'disconnected',
    },
    uptime: process.uptime(),
  });
};
