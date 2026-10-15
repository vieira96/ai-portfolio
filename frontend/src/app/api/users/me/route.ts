import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: 'Missing authentication' },
      { status: 401 },
    );
  }

  const backendResponse = await backendFetch('/users/me', {
    method: 'PATCH',
    headers: { cookie: `access_token=${token}` },
    body: JSON.stringify(await request.json()),
  });

  return NextResponse.json(await backendResponse.json(), {
    status: backendResponse.status,
  });
}
