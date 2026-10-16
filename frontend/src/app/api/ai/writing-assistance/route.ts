import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { writingAssistanceFieldTypes } from "@/lib/ai/writing-assistance";

const requestSchema = z.object({
  fieldType: z.enum(writingAssistanceFieldTypes),
  text: z
    .string()
    .min(1)
    .max(10000)
    .refine((value) => value.trim().length > 0),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Missing authentication" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { statusCode: 400, message: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { statusCode: 400, message: "Invalid field type or text" },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await backendFetch("/ai/writing-assistance", {
      method: "POST",
      headers: { cookie: `access_token=${token}` },
      body: JSON.stringify(parsed.data),
    });
    const responseBody: unknown = await backendResponse
      .json()
      .catch(() => ({ message: "Invalid backend response" }));

    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: "AI service unavailable" },
      { status: 502 },
    );
  }
}
