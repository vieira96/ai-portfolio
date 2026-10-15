import { NextRequest, NextResponse } from 'next/server';
import { backendUrl } from '@/lib/backend';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('size') ?? '2';

  const backendResponse = await fetch(
    backendUrl(`/educations?page=${page}&size=${size}`),
    { cache: 'no-store' },
  );

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

  const backendResponse = await fetch(backendUrl('/educations'), {
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
