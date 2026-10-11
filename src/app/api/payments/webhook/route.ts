import { NextRequest, NextResponse } from "next/server";
import { validSignature, recordCapturedPayment } from "@/lib/payments";
import { boundedBody } from "@/lib/security";
export async function POST(req: NextRequest) {
  let raw: string;
  try {
    raw = new TextDecoder().decode(await boundedBody(req, 262144));
  } catch {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }
  if (
    !validSignature(
      raw,
      req.headers.get("x-razorpay-signature") || "",
      process.env.RAZORPAY_WEBHOOK_SECRET || "",
    )
  )
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  try {
    const body = JSON.parse(raw);
    if (body.event === "payment.captured")
      await recordCapturedPayment(body.payload.payment.entity);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
