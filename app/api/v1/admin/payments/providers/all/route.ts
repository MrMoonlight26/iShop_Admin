import { NextRequest, NextResponse } from "next/server";

const providers = [
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
  if (!checkDevAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(providers);
}
