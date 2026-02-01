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

export async function GET(req: NextRequest) {
  return NextResponse.json(providers);
}
