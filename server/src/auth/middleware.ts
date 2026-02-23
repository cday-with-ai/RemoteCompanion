import type { Request, Response, NextFunction } from 'express';

const API_KEY = process.env['CLAUDE_SERVER_API_KEY'];

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!API_KEY) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== API_KEY) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  next();
}
