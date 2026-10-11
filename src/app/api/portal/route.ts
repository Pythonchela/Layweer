import { readJson } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validOrigin, consumeLimit, throttleKey } from "@/lib/security";
export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user || user.role !== "CLIENT" || !user.client)
    return NextResponse.json(
      { error: "Client account required" },
      { status: 403 },
    );
  const clientId = user.client.id;
  if (user.mustChangePassword || user.mustEnable2FA)
    return NextResponse.json(
      { error: "Change your temporary password in My account first" },
      { status: 403 },
    );
  const [cases, hearings, documents, invoices, notifications, communications] =
    await Promise.all([
      prisma.case.findMany({
        where: { clientId },
        select: {
          id: true,
          caseId: true,
          caseNumber: true,
          cnrNumber: true,
          title: true,
          caseType: true,
          court: true,
          bench: true,
          judge: true,
          stage: true,
          status: true,
          filingDate: true,
          registrationDate: true,
          nextHearingDate: true,
          seniorAdvocate: { select: { user: { select: { name: true } } } },
        },
      }),
      prisma.hearing.findMany({
        where: { case: { clientId } },
        select: {
          id: true,
          caseId: true,
          hearingDate: true,
          hearingTime: true,
          court: true,
          courtroom: true,
          judge: true,
          purpose: true,
          status: true,
          outcome: true,
          nextDate: true,
        },
        orderBy: { hearingDate: "desc" },
      }),
      prisma.document.findMany({
        where: { isPublic: true, OR: [{ clientId }, { case: { clientId } }] },
        select: {
          id: true,
          name: true,
          category: true,
          createdAt: true,
          version: true,
        },
      }),
      prisma.invoice.findMany({
        where: { clientId },
        select: {
          id: true,
          invoiceNumber: true,
          issueDate: true,
          dueDate: true,
          totalAmount: true,
          paidAmount: true,
          pendingAmount: true,
          gstAmount: true,
          creditAmount: true,
          status: true,
          items: {
            select: {
              description: true,
              feeType: true,
              quantity: true,
              rate: true,
              amount: true,
            },
          },
          payments: {
            select: {
              amount: true,
              paymentDate: true,
              paymentMethod: true,
              receiptNumber: true,
            },
          },
        },
      }),
      prisma.notification.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          title: true,
          message: true,
          createdAt: true,
          isRead: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.communication.findMany({
        where: { clientId, type: { in: ["PORTAL_MESSAGE", "PORTAL_REPLY"] } },
        select: {
          id: true,
          type: true,
          subject: true,
          message: true,
          sentAt: true,
        },
        orderBy: { sentAt: "desc" },
      }),
    ]);
  return NextResponse.json({
    client: {
      id: user.client.id,
      name: user.client.name,
      email: user.client.email,
      mobile: user.client.mobile,
    },
    cases,
    hearings,
    documents,
    invoices,
    notifications,
    communications,
  });
}
export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user || user.role !== "CLIENT" || !user.client)
    return NextResponse.json(
      { error: "Client account required" },
      { status: 403 },
    );
  if (user.mustChangePassword || user.mustEnable2FA)
    return NextResponse.json(
      { error: "Change your temporary password first" },
      { status: 403 },
    );
  if (!validOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!(await consumeLimit(throttleKey("portal-message", user.id), 30, 60000)))
    return NextResponse.json(
      { error: "Too many messages. Try again shortly." },
      { status: 429 },
    );
  const { message } = await readJson(req);
  if (typeof message !== "string" || !message.trim() || message.length > 10000)
    return NextResponse.json(
      { error: "Enter a message up to 10,000 characters" },
      { status: 400 },
    );
  await prisma.communication.create({
    data: {
      clientId: user.client.id,
      type: "PORTAL_MESSAGE",
      message: message.trim(),
      sentBy: user.id,
    },
  });
  return NextResponse.json({ success: true });
}
