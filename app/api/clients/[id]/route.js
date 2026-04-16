export const runtime = 'nodejs';

import prisma from '../../../../lib/prisma.js';

function isSimpleEmail(val) {
  if (!val) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

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

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : null;

  if (!name) {
    return Response.json({ status: 'error', message: 'name is required' }, { status: 400 });
  }

  if (email && !isSimpleEmail(email)) {
    return Response.json({ status: 'error', message: 'email must be a valid email address' }, { status: 400 });
  }

  try {
    const client = await prisma.client.update({
      where: { id },
      data: { name, email: email || null },
    });
    return Response.json({ status: 'ok', module: 'clients', message: 'client updated', data: client });
  } catch (err) {
    if (err.code === 'P2025') {
      return Response.json({ status: 'error', message: 'client not found' }, { status: 404 });
    }
    return Response.json({ status: 'error', message: 'failed to update client' }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const { id: rawId } = await params;
  const id = parseId({ id: rawId });
  if (!id) {
    return Response.json({ status: 'error', message: 'invalid id' }, { status: 400 });
  }

  try {
    await prisma.client.delete({ where: { id } });
    return Response.json({ status: 'ok', module: 'clients', message: 'client deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return Response.json({ status: 'error', message: 'client not found' }, { status: 404 });
    }
    return Response.json({ status: 'error', message: 'failed to delete client' }, { status: 500 });
  }
}
