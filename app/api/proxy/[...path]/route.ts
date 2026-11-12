import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://api.kairso.com/api";

function signAppToken(secret: string, method: string, path: string): string {
  const now = new Date();
  now.setUTCSeconds(0, 0);
  const payload = `${now.getTime()}\n${method.toUpperCase()}\n${path}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

const FORWARDED_HEADERS = ["authorization", "content-type", "x-conn-id", "accept-language"];

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const isPublicRoute = path[0] === "public";
  const secret = process.env.APP_SIGNATURE_SECRET;

  if (!secret && !isPublicRoute) {
    return NextResponse.json({ error: "APP_SIGNATURE_SECRET is not configured" }, { status: 500 });
  }

  try {
    const targetPath = isPublicRoute ? `/${path.join("/")}` : `/api/${path.join("/")}`;
    const targetUrl = `${new URL(BACKEND_BASE).origin}${targetPath}${req.nextUrl.search}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (secret && !isPublicRoute) {
      headers["X-App-Token"] = signAppToken(secret, req.method, targetPath);
    }
    for (const name of FORWARDED_HEADERS) {
      const value = req.headers.get(name);
      if (value) headers[name] = value;
    }

    const hasBody = !["GET", "HEAD"].includes(req.method);
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
    });

    return new NextResponse(upstream.status === 204 ? null : await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") || "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach the backend";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
