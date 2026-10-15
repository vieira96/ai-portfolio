import { NextRequest, NextResponse } from 'next/server';
import { backendUrl } from '@/lib/backend';

export async function GET(): Promise<NextResponse> {
  const backendResponse = await fetch(backendUrl('/technologies'), {
    cache: 'no-store',
  });

  return NextResponse.json(await backendResponse.json(), {
    status: backendResponse.status,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: 'Missing authentication' },
      { status: 401 },
    );
  }

  const backendResponse = await fetch(backendUrl('/technologies'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: `access_token=${token}`,
    },
    body: JSON.stringify(await request.json()),
  });

  return NextResponse.json(await backendResponse.json(), {
    status: backendResponse.status,
  });
}
