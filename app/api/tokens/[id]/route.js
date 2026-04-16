export const runtime = 'nodejs';

import prisma from '../../../../lib/prisma.js';

const VALID_PLATFORMS = ['GOOGLE', 'META', 'TIKTOK'];

function parseId(params) {
  const id = parseInt(params.id, 10);
  return Number.isFinite(id) ? id : null;
}

export async function PUT(req, { params }) {
  const { id: rawId } = await params;
  const id = parseId({ id: rawId });
  if (!id) {
    return Response.json({ status: 'error', message: 'invalid id' }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ status: 'error', message: 'invalid JSON body' }, { status: 400 });
  }

  const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';
  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken.trim() : null;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  const platform = typeof body.platform === 'string' ? body.platform.toUpperCase().trim() : null;

  if (!accessToken) {
    return Response.json({ status: 'error', message: 'accessToken is required' }, { status: 400 });
  }
  if (platform && !VALID_PLATFORMS.includes(platform)) {
    return Response.json({ status: 'error', message: 'platform must be one of: GOOGLE, META, TIKTOK' }, { status: 400 });
  }
  if (expiresAt && isNaN(expiresAt.getTime())) {
    return Response.json({ status: 'error', message: 'expiresAt must be a valid ISO date string' }, { status: 400 });
  }

  const data = { accessToken, refreshToken: refreshToken || null, expiresAt };
  if (platform) data.platform = platform;

  try {
    const token = await prisma.clientToken.update({
      where: { id },
      data,
    });
    return Response.json({ status: 'ok', module: 'tokens', message: 'token updated', data: token });
  } catch (err) {
    if (err.code === 'P2025') {
      return Response.json({ status: 'error', message: 'token not found' }, { status: 404 });
    }
    if (err.code === 'P2002') {
      return Response.json({ status: 'error', message: 'token already exists for this client and platform' }, { status: 409 });
    }
    return Response.json({ status: 'error', message: 'failed to update token' }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const { id: rawId } = await params;
  const id = parseId({ id: rawId });
  if (!id) {
    return Response.json({ status: 'error', message: 'invalid id' }, { status: 400 });
  }

  try {
    await prisma.clientToken.delete({ where: { id } });
    return Response.json({ status: 'ok', module: 'tokens', message: 'token deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return Response.json({ status: 'error', message: 'token not found' }, { status: 404 });
    }
    return Response.json({ status: 'error', message: 'failed to delete token' }, { status: 500 });
  }
}
