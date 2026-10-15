import { NextRequest, NextResponse } from 'next/server';
import { backendUrl } from '@/lib/backend';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: 'Missing authentication' },
      { status: 401 },
    );
  }

  const backendResponse = await fetch(backendUrl('/uploads'), {
    method: 'POST',
    headers: { cookie: `access_token=${token}` },
    body: await request.formData(),
  });

  return NextResponse.json(await backendResponse.json(), {
    status: backendResponse.status,
  });
}
