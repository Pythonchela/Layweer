import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validOrigin,
  consumeLimit,
  throttleKey,
  clientAddress,
  readJson,
} from "@/lib/security";
export async function GET() {
  const advocates = await prisma.employee.findMany({
    where: {
      isActive: true,
      user: {
        role: {
          in: ["SENIOR_ADVOCATE", "ADVOCATE", "JUNIOR_ADVOCATE", "ASSOCIATE"],
        },
        isActive: true,
      },
    },
    select: {
      id: true,
      designation: true,
      department: true,
      user: { select: { name: true } },
    },
  });
  return NextResponse.json({
    advocates: advocates.map((a) => ({
      id: a.id,
      name: a.user.name,
      designation: a.designation || "Advocate",
      speciality: a.department || "Legal consultation",
    })),
  });
}
export async function POST(req: NextRequest) {
  try {
    if (!validOrigin(req))
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    if (
      !(await consumeLimit(
        throttleKey("public-appointment", clientAddress(req)),
        5,
        60000,
      ))
    )
      return NextResponse.json(
        { error: "Please wait a minute before submitting again" },
        { status: 429 },
      );
    const b = await readJson(req, 32768);
    if (
      typeof b.name !== "string" ||
      !b.name.trim() ||
      typeof b.mobile !== "string" ||
      !/^[+\d\s-]{8,20}$/.test(b.mobile) ||
      !b.date ||
      !b.slot ||
      !b.advocateId
    )
      return NextResponse.json(
        {
          error:
            "Name, valid mobile number, advocate, date and slot are required",
        },
        { status: 400 },
      );
    const date = new Date(b.date);
    if (
      !Number.isFinite(date.getTime()) ||
      date.getTime() < new Date().setUTCHours(0, 0, 0, 0)
    )
      return NextResponse.json(
        { error: "Select a valid future date" },
        { status: 400 },
      );
    if (!["ONLINE", "OFFLINE", "PHONE"].includes(b.consultationType))
      return NextResponse.json(
        { error: "Invalid consultation type" },
        { status: 400 },
      );
    const employee = await prisma.employee.findFirst({
      where: {
        id: String(b.advocateId),
        isActive: true,
        user: {
          isActive: true,
          role: {
            in: ["SENIOR_ADVOCATE", "ADVOCATE", "JUNIOR_ADVOCATE", "ASSOCIATE"],
          },
        },
      },
    });
    if (!employee)
      return NextResponse.json(
        { error: "Advocate is not available" },
        { status: 400 },
      );
    const appointment = await prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findFirst({
        where: {
          advocateId: employee.id,
          appointmentDate: date,
          slot: String(b.slot),
          status: { not: "CANCELLED" },
        },
      });
      if (existing)
        throw new Error("That slot is already booked. Choose another.");
      return tx.appointment.create({
        data: {
          name: b.name.trim().slice(0, 200),
          mobile: b.mobile,
          email: typeof b.email === "string" ? b.email.slice(0, 200) : null,
          advocateId: employee.id,
          appointmentDate: date,
          slot: String(b.slot).slice(0, 30),
          type: b.consultationType,
          purpose: String(b.practiceArea || "Consultation").slice(0, 200),
          notes: String(b.description || "").slice(0, 10000),
          status: "PENDING",
          fee:
            b.consultationType === "ONLINE"
              ? 400
              : b.consultationType === "PHONE"
                ? 300
                : 500,
        },
      });
    });
    return NextResponse.json(
      { appointment: { id: appointment.id, status: appointment.status } },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
