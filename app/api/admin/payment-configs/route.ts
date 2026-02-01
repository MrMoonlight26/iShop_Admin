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
let paymentConfigs: any[] = [
  {
    type: "DIGITAL_PREPAID",
    displayName: "Digital Prepaid",
    description: "Digital prepaid wallet",
    iconUrl: "",
    isEnabled: true,
    surchargePercentage: 0,
  },
];

// GET /api/v1/admin/payment-configs
export async function GET(req: NextRequest) {
  if (!checkDevAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(paymentConfigs);
}

// PUT /api/v1/admin/payment-configs/{type}
export async function PUT(req: NextRequest) {
  if (!checkDevAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const type = url.pathname.split("/").pop();
  const body = await req.json();
  if (!type) {
    return NextResponse.json({ error: "Missing type parameter" }, { status: 400 });
  }
  const idx = paymentConfigs.findIndex((c) => c.type === type);
  if (idx === -1) {
    paymentConfigs.push({ type, ...body });
  } else {
    paymentConfigs[idx] = { ...paymentConfigs[idx], ...body };
  }
  return NextResponse.json({ success: true });
}
