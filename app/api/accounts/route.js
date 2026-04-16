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

    const accounts = await prisma.adAccount.findMany({
      where,
      take: limit > 0 ? limit : 25,
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ status: 'ok', module: 'accounts', message: 'accounts list', data: accounts });
  } catch {
    return Response.json({ status: 'error', message: 'failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const clientId = typeof body.clientId === 'number' ? body.clientId : parseInt(body.clientId, 10);
    const platform = typeof body.platform === 'string' ? body.platform.toUpperCase().trim() : '';
    const externalAccountId = typeof body.externalAccountId === 'string' ? body.externalAccountId.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : null;

    if (!Number.isFinite(clientId)) {
      return Response.json({ status: 'error', message: 'clientId is required and must be a number' }, { status: 400 });
    }
    if (!VALID_PLATFORMS.includes(platform)) {
      return Response.json({ status: 'error', message: 'platform must be one of: GOOGLE, META, TIKTOK' }, { status: 400 });
    }
    if (!externalAccountId) {
      return Response.json({ status: 'error', message: 'externalAccountId is required' }, { status: 400 });
    }

    const account = await prisma.adAccount.create({
      data: { clientId, platform, externalAccountId, name: name || null },
    });

    return Response.json({ status: 'ok', module: 'accounts', message: 'account created', data: account }, { status: 201 });
  } catch (err) {
    if (err.code === 'P2003') {
      return Response.json({ status: 'error', message: 'client not found' }, { status: 404 });
    }
    return Response.json({ status: 'error', message: 'failed to create account' }, { status: 500 });
  }
}
