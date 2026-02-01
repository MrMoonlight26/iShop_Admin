import { NextRequest, NextResponse } from "next/server";

let templates: any[] = [];

function checkDevAuth(req: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const devSecret = req.headers.get("x-dev-secret");
    if (devSecret === "dev-secret") return true;
    return false;
  }
  return false;
}

export async function GET(req: NextRequest) {
  if (!checkDevAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  if (!checkDevAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.templateId) return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
  templates.push({ ...body, isActive: true });
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  if (!checkDevAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const templateId = url.pathname.split("/").pop();
  const body = await req.json();
  if (!templateId) return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
  const idx = templates.findIndex((t) => t.templateId === templateId);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  templates[idx] = { ...templates[idx], ...body };
  return NextResponse.json({ success: true });
}
