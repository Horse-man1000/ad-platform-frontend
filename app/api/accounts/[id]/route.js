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

  const externalAccountId = typeof body.externalAccountId === 'string' ? body.externalAccountId.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : null;
  const platform = typeof body.platform === 'string' ? body.platform.toUpperCase().trim() : null;

  if (!externalAccountId) {
    return Response.json({ status: 'error', message: 'externalAccountId is required' }, { status: 400 });
  }
  if (platform && !VALID_PLATFORMS.includes(platform)) {
    return Response.json({ status: 'error', message: 'platform must be one of: GOOGLE, META, TIKTOK' }, { status: 400 });
  }

  const data = { externalAccountId, name: name || null };
  if (platform) data.platform = platform;

  try {
    const account = await prisma.adAccount.update({
      where: { id },
      data,
    });
    return Response.json({ status: 'ok', module: 'accounts', message: 'account updated', data: account });
  } catch (err) {
    if (err.code === 'P2025') {
      return Response.json({ status: 'error', message: 'account not found' }, { status: 404 });
    }
    return Response.json({ status: 'error', message: 'failed to update account' }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const { id: rawId } = await params;
  const id = parseId({ id: rawId });
  if (!id) {
    return Response.json({ status: 'error', message: 'invalid id' }, { status: 400 });
  }

  try {
    await prisma.adAccount.delete({ where: { id } });
    return Response.json({ status: 'ok', module: 'accounts', message: 'account deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return Response.json({ status: 'error', message: 'account not found' }, { status: 404 });
    }
    return Response.json({ status: 'error', message: 'failed to delete account' }, { status: 500 });
  }
}
