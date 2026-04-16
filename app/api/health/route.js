export async function GET() {
  return Response.json({ status: 'ok', service: 'ad-platform', message: 'health check passed' });
}
