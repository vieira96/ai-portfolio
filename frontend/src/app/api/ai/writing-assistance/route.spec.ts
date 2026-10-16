import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route.js";

function buildRequest(cookie?: string, body: unknown = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cookie) {
    headers.cookie = cookie;
  }
  return new NextRequest("http://localhost/api/ai/writing-assistance", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/writing-assistance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("denies the request without an authentication cookie", async () => {
    const response = await POST(
      buildRequest(undefined, { fieldType: "bio", text: "Texto original." }),
    );

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("forwards only the validated field and text with the auth cookie", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ suggestion: "Texto revisado." }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await POST(
      buildRequest("access_token=jwt", {
        fieldType: "bio",
        text: " Texto original. ",
        unrelated: "must not be forwarded",
      }),
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/ai/writing-assistance"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ cookie: "access_token=jwt" }),
        body: JSON.stringify({ fieldType: "bio", text: " Texto original. " }),
      }),
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      suggestion: "Texto revisado.",
    });
  });

  it("rejects invalid fields and oversized text without calling the backend", async () => {
    const invalidType = await POST(
      buildRequest("access_token=jwt", {
        fieldType: "resumeSummary",
        text: "Texto original.",
      }),
    );
    const oversizedText = await POST(
      buildRequest("access_token=jwt", {
        fieldType: "bio",
        text: "a".repeat(10001),
      }),
    );

    expect(invalidType.status).toBe(400);
    expect(oversizedText.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns the backend error status and body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ statusCode: 503, message: "Unavailable" }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const response = await POST(
      buildRequest("access_token=jwt", {
        fieldType: "bio",
        text: "Texto original.",
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      statusCode: 503,
      message: "Unavailable",
    });
  });
});
