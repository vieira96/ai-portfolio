import { NextRequest, NextResponse } from 'next/server';
import { backendUrl } from '@/lib/backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const backendResponse = await fetch(backendUrl(`/educations/${id}`), {
    cache: 'no-store',
  });

  return NextResponse.json(await backendResponse.json(), {
    status: backendResponse.status,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: 'Missing authentication' },
      { status: 401 },
    );
  }

  const { id } = await params;
  const backendResponse = await fetch(backendUrl(`/educations/${id}`), {
    method: 'PATCH',
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: 'Missing authentication' },
      { status: 401 },
    );
  }

  const { id } = await params;
  const backendResponse = await fetch(backendUrl(`/educations/${id}`), {
    method: 'DELETE',
    headers: { cookie: `access_token=${token}` },
  });

  if (backendResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(await backendResponse.json(), {
    status: backendResponse.status,
  });
}
