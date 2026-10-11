import { readJson } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { currentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  paymentRequest,
  validSignature,
  recordCapturedPayment,
} from "@/lib/payments";
import { validOrigin } from "@/lib/security";
export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user)
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (user.mustChangePassword || user.mustEnable2FA || !validOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const b = await readJson(req);
    const order = await prisma.paymentOrder.findUnique({
      where: { id: String(b.razorpay_order_id) },
      include: { invoice: true },
    });
    if (
      !order ||
      (user.role === "CLIENT"
        ? order.invoice.clientId !== user.client?.id
        : !hasPermission(user.role, "billing:write"))
    )
      return NextResponse.json(
        { error: "Order not accessible" },
        { status: 403 },
      );
    if (
      !validSignature(
        `${order.id}|${b.razorpay_payment_id}`,
        String(b.razorpay_signature),
        process.env.RAZORPAY_KEY_SECRET || "",
      )
    )
      throw new Error("Invalid payment signature");
    const payment = await paymentRequest(
      `payments/${encodeURIComponent(b.razorpay_payment_id)}`,
    );
    if (payment.order_id !== order.id) throw new Error("Order does not match");
    await recordCapturedPayment(payment);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
