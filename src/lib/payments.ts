import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { prisma } from "./prisma";
export function validSignature(
  text: string,
  signature: string,
  secret: string,
) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(text).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function paymentConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
export async function paymentRequest(endpoint: string, body?: unknown) {
  if (!paymentConfigured())
    throw new Error(
      "Online payment is not configured. Contact the firm to pay by UPI, cash or bank transfer.",
    );
  const r = await fetch(`https://api.razorpay.com/v1/${endpoint}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const data = await r.json();
  if (!r.ok)
    throw new Error(
      data.error?.description || "Payment provider request failed",
    );
  return data;
}
export async function recordCapturedPayment(payment: any) {
  if (payment.status !== "captured" || payment.currency !== "INR")
    throw new Error("Payment has not been captured");
  return prisma.$transaction(async (tx) => {
    const order = await tx.paymentOrder.findUnique({
      where: { id: payment.order_id },
    });
    if (!order || order.amount !== payment.amount)
      throw new Error("Payment amount or order does not match");
    if (order.paymentId) {
      if (order.paymentId !== payment.id) throw new Error("Order already paid");
      return { alreadyRecorded: true };
    }
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: order.invoiceId },
    });
    const cancelled = invoice.status === "CANCELLED";
    const amount = payment.amount / 100,
      paidAmount = Math.round((invoice.paidAmount + amount) * 100) / 100,
      pendingAmount = cancelled
        ? 0
        : Math.max(
            0,
            Math.round((invoice.totalAmount - paidAmount) * 100) / 100,
          ),
      creditAmount = cancelled
        ? paidAmount
        : Math.max(
            0,
            Math.round((paidAmount - invoice.totalAmount) * 100) / 100,
          );
    await tx.payment.create({
      data: {
        paymentId: `PAY-${randomUUID()}`,
        clientId: invoice.clientId,
        invoiceId: invoice.id,
        amount,
        paymentMethod: "ONLINE",
        transactionId: payment.id,
        receiptNumber: `REC-${randomUUID().slice(0, 8)}`,
        notes: "Verified Razorpay payment",
      },
    });
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount,
        pendingAmount,
        creditAmount,
        status: cancelled
          ? "CANCELLED"
          : pendingAmount === 0
            ? "PAID"
            : "PARTIAL",
      },
    });
    await tx.paymentOrder.update({
      where: { id: order.id },
      data: { status: "PAID", paymentId: payment.id },
    });
    return { alreadyRecorded: false };
  });
}
