import { NextRequest, NextResponse } from "next/server";

function checkDevAuth(req: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const devSecret = req.headers.get("x-dev-secret");
    if (devSecret === "dev-secret") return true;
    return false;
  }
  // Always fail in prod until real auth is added
  return false;
}

// In-memory store for demonstration (replace with DB in production)
let templates: any[] = [];

// GET /api/admin/templates
export async function GET(req: NextRequest) {
  if (!checkDevAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(templates);
}

// POST /api/admin/templates
export async function POST(req: NextRequest) {
  if (!checkDevAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.templateId || !body.channel || !body.subject || !body.body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  templates.push({ ...body, isActive: true });
  return NextResponse.json({ success: true });
}

// PUT /api/admin/templates/{templateId}
export async function PUT(req: NextRequest) {
  if (!checkDevAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const templateId = url.pathname.split("/").pop();
  const body = await req.json();
  if (!templateId) {
    return NextResponse.json({ error: "Missing templateId parameter" }, { status: 400 });
  }
  const idx = templates.findIndex((t) => t.templateId === templateId);
  if (idx === -1) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  templates[idx] = { ...templates[idx], ...body };
  return NextResponse.json({ success: true });
}
