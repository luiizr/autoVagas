import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
export interface AuthRequest extends Request {
  userId?: string;
}
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  try {
    const payload = jwt.verify(token ?? '', process.env.JWT_SECRET ?? '') as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Autenticação necessária.' });
  }
}
