import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../types';

export async function idempotencyMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    return next();
  }

  // Only apply to state-mutating HTTP methods
  if (req.method !== 'POST' && req.method !== 'PATCH' && req.method !== 'PUT') {
    return next();
  }

  if (!req.user) {
    return next();
  }

  const rawKey = idempotencyKey.trim();
  const requestHash = crypto
    .createHash('sha256')
    .update(`${req.originalUrl}::${JSON.stringify(req.body || {})}`)
    .digest('hex');

  try {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key: rawKey },
    });

    if (existing) {
      if (existing.statusCode !== null) {
        // Cached replay response
        res.setHeader('X-Idempotency-Replay', 'true');
        return res.status(existing.statusCode).json(existing.responseBody);
      }

      if (existing.lockedUntil && existing.lockedUntil > new Date()) {
        return res.status(409).json({
          error: 'IN_FLIGHT_REQUEST',
          message: 'An identical request with this idempotency key is currently processing. Please wait for completion.',
        });
      }
    }

    // Register in-flight idempotency key
    await prisma.idempotencyKey.upsert({
      where: { key: rawKey },
      update: {
        userId: req.user.id,
        requestPath: req.originalUrl,
        requestHash,
        lockedUntil: new Date(Date.now() + 30000), // 30s lock
      },
      create: {
        key: rawKey,
        userId: req.user.id,
        requestPath: req.originalUrl,
        requestHash,
        lockedUntil: new Date(Date.now() + 30000),
      },
    });

    // Intercept response to store result
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful or client-error outcomes (avoid caching 500 server crashes)
      if (res.statusCode < 500) {
        prisma.idempotencyKey.update({
          where: { key: rawKey },
          data: {
            statusCode: res.statusCode,
            responseBody: body,
            lockedUntil: null,
          },
        }).catch((err) => {
          console.error('[Idempotency] Failed to store response:', err);
        });
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    next(err);
  }
}
