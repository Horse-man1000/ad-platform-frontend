export const runtime = 'nodejs';

import prisma from '../../../lib/prisma.js';

const VALID_PLATFORMS = ['GOOGLE', 'META', 'TIKTOK'];

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const clientIdParam = searchParams.get('clientId');
    const limit = limitParam ? parseInt(limitParam, 10) : 25;

    const where = {};
    if (clientIdParam) {
      const clientId = parseInt(clientIdParam, 10);
      if (!Number.isFinite(clientId)) {
        return Response.json({ status: 'error', message: 'invalid clientId' }, { status: 400 });
      }
      where.clientId = clientId;
    }

    const tokens = await prisma.clientToken.findMany({
      where,
      take: limit > 0 ? limit : 25,
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ status: 'ok', module: 'tokens', message: 'tokens list', data: tokens });
  } catch {
    return Response.json({ status: 'error', message: 'failed to fetch tokens' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const clientId = typeof body.clientId === 'number' ? body.clientId : parseInt(body.clientId, 10);
    const platform = typeof body.platform === 'string' ? body.platform.toUpperCase().trim() : '';
    const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';
    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken.trim() : null;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    if (!Number.isFinite(clientId)) {
      return Response.json({ status: 'error', message: 'clientId is required and must be a number' }, { status: 400 });
    }
    if (!VALID_PLATFORMS.includes(platform)) {
      return Response.json({ status: 'error', message: 'platform must be one of: GOOGLE, META, TIKTOK' }, { status: 400 });
    }
    if (!accessToken) {
      return Response.json({ status: 'error', message: 'accessToken is required' }, { status: 400 });
    }
    if (expiresAt && isNaN(expiresAt.getTime())) {
      return Response.json({ status: 'error', message: 'expiresAt must be a valid ISO date string' }, { status: 400 });
    }

    const token = await prisma.clientToken.create({
      data: { clientId, platform, accessToken, refreshToken: refreshToken || null, expiresAt },
    });

    return Response.json({ status: 'ok', module: 'tokens', message: 'token created', data: token }, { status: 201 });
  } catch (err) {
    if (err.code === 'P2002') {
      return Response.json({ status: 'error', message: 'token already exists for this client and platform' }, { status: 409 });
    }
    if (err.code === 'P2003') {
      return Response.json({ status: 'error', message: 'client not found' }, { status: 404 });
    }
    return Response.json({ status: 'error', message: 'failed to create token' }, { status: 500 });
  }
}
