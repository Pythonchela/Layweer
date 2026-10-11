import { prisma } from "./prisma";
export async function queueClientMessage(
  db: any,
  client: any,
  message: string,
  caseId?: string,
) {
  if (!client) return;
  const types = [
    ...(client.whatsappOptIn ? ["WHATSAPP"] : []),
    ...(client.smsOptIn ? ["SMS"] : []),
  ];
  for (const type of types)
    await db.reminder.create({
      data: {
        caseId,
        type,
        message,
        sendAt: new Date(),
        recipientId: client.id,
      },
    });
}
export async function processReminders() {
  const sid = process.env.TWILIO_ACCOUNT_SID,
    token = process.env.TWILIO_AUTH_TOKEN;
  if (process.env.NOTIFICATIONS_ENABLED !== "true" || !sid || !token)
    throw new Error(
      "External notifications are disabled. Configure Twilio and enable notifications first.",
    );
  const reminders = await prisma.reminder.findMany({
    where: {
      deliveryStatus: "QUEUED",
      sendAt: { lte: new Date() },
      isSent: false,
    },
    take: 20,
    orderBy: { sendAt: "asc" },
  });
  let submitted = 0,
    skipped = 0;
  for (const reminder of reminders) {
    const client = reminder.caseId
      ? await prisma.client.findFirst({
          where: { cases: { some: { id: reminder.caseId } } },
        })
      : await prisma.client.findFirst({
          where: {
            OR: [
              { id: reminder.recipientId || "" },
              { userId: reminder.recipientId || "" },
            ],
          },
        });
    const channel = reminder.type === "SMS" ? "SMS" : "WHATSAPP";
    if (
      !client ||
      (channel === "SMS" ? !client.smsOptIn : !client.whatsappOptIn)
    ) {
      skipped++;
      continue;
    }
    const from =
        channel === "SMS"
          ? process.env.TWILIO_SMS_FROM
          : process.env.TWILIO_WHATSAPP_FROM,
      contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID;
    if (!from || (channel === "WHATSAPP" && !contentSid)) {
      skipped++;
      continue;
    }
    const mobile = client.mobile.replace(/[\s-]/g, "");
    if (!/^\+\d{8,15}$/.test(mobile)) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { lastError: "Client mobile must include the country code" },
      });
      skipped++;
      continue;
    }
    const claimed = await prisma.reminder.updateMany({
      where: { id: reminder.id, deliveryStatus: "QUEUED" },
      data: { deliveryStatus: "SUBMITTING" },
    });
    if (!claimed.count) continue;
    try {
      const data = new URLSearchParams({
        From:
          channel === "SMS"
            ? from
            : `whatsapp:${from.replace(/^whatsapp:/, "")}`,
        To: channel === "SMS" ? mobile : `whatsapp:${mobile}`,
      });
      if (channel === "SMS") data.set("Body", reminder.message);
      else {
        data.set("ContentSid", contentSid!);
        data.set("ContentVariables", JSON.stringify({ "1": reminder.message }));
      }
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: data,
          signal: AbortSignal.timeout(15000),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Message rejected by provider");
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          isSent: true,
          sentAt: new Date(),
          providerMessageId: result.sid,
          deliveryStatus: "SUBMITTED",
          lastError: null,
        },
      });
      submitted++;
    } catch (e) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          deliveryStatus: "REVIEW_REQUIRED",
          lastError: (e as Error).message.slice(0, 1000),
        },
      });
    }
  }
  return { submitted, skipped };
}
