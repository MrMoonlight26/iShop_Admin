import { NextRequest, NextResponse } from "next/server";

let paymentConfigs: any[] = [
  {
    type: "DIGITAL_PREPAID",
    displayName: "Digital Prepaid",
    description: "Digital prepaid wallet",
    iconUrl: "",
    isEnabled: true,
    surchargePercentage: 0,
    inputTemplate: "",
  },
];

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
  return NextResponse.json(paymentConfigs);
}

export async function POST(req: NextRequest) {
  if (!checkDevAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.type) return NextResponse.json({ error: "Missing type" }, { status: 400 });
  paymentConfigs.push(body);
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  if (!checkDevAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const type = url.pathname.split("/").pop();
  const body = await req.json();
  if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });
  const idx = paymentConfigs.findIndex((c) => c.type === type);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  paymentConfigs[idx] = { ...paymentConfigs[idx], ...body };
  return NextResponse.json({ success: true });
}
