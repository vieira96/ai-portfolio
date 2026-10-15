import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const backendResponse = await backendFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const response = NextResponse.json(await backendResponse.json(), {
    status: backendResponse.status,
  });

  const setCookie = backendResponse.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }

  return response;
}
