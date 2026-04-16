import prisma from '../../../lib/prisma.js';

function isSimpleEmail(val) {
  if (!val) return true; // email is optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 25;

    const clients = await prisma.client.findMany({
      take: limit > 0 ? limit : 25,
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ status: 'ok', module: 'clients', message: 'clients list', data: clients });
  } catch {
    return Response.json({ status: 'error', message: 'failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : null;

    if (!name) {
      return Response.json({ status: 'error', message: 'name is required' }, { status: 400 });
    }

    if (email && !isSimpleEmail(email)) {
      return Response.json({ status: 'error', message: 'email must be a valid email address' }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: { name, email: email || null },
    });

    return Response.json({ status: 'ok', module: 'clients', message: 'client created', data: client }, { status: 201 });
  } catch {
    return Response.json({ status: 'error', message: 'failed to create client' }, { status: 500 });
  }
}
