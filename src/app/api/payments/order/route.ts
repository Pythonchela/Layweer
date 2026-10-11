import { readJson } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { currentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentConfigured, paymentRequest } from "@/lib/payments";
import { validOrigin, consumeLimit, throttleKey } from "@/lib/security";
export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user)
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (user.mustChangePassword || user.mustEnable2FA || !validOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!(await consumeLimit(throttleKey("payment-order", user.id), 20, 60000)))
    return NextResponse.json(
      { error: "Too many payment requests" },
      { status: 429 },
    );
  if (!paymentConfigured())
    return NextResponse.json(
      {
        error:
          "Online payment is not configured. Contact the firm to pay by UPI, cash or bank transfer.",
      },
      { status: 503 },
    );
  try {
    const { invoiceId } = await readJson(req);
    const invoice = await prisma.invoice.findUnique({
      where: { id: String(invoiceId) },
    });
    if (
      !invoice ||
      (user.role === "CLIENT"
        ? invoice.clientId !== user.client?.id
        : !hasPermission(user.role, "billing:write"))
    )
      return NextResponse.json(
        { error: "Invoice not accessible" },
        { status: 403 },
      );
    if (invoice.pendingAmount <= 0 || invoice.status === "CANCELLED")
      throw new Error("Invoice has no payable balance");
    const amount = Math.round(invoice.pendingAmount * 100);
    const order = await paymentRequest("orders", {
      amount,
      currency: "INR",
      receipt: invoice.invoiceNumber,
      notes: { invoiceId: invoice.id },
    });
    await prisma.paymentOrder.create({
      data: { id: order.id, invoiceId: invoice.id, amount, currency: "INR" },
    });
    return NextResponse.json({
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      name: user.name,
      email: user.email,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
