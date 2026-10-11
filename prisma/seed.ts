import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users ──────────────────────────────────────────────────────────
  const superAdminPwd = await bcrypt.hash("Admin@123", 12);
  const clientPwd = await bcrypt.hash("Client@123", 12);
  const advocatePwd = await bcrypt.hash("Advocate@123", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@lexfirm.com" },
    update: {},
    create: {
      name: "Super Administrator",
      email: "admin@lexfirm.com",
      password: superAdminPwd,
      role: "SUPER_ADMIN",
      phone: "+91 98765 00000",
      isActive: true,
    },
  });

  const seniorAdvocate = await prisma.user.upsert({
    where: { email: "rajendra@lexfirm.com" },
    update: {},
    create: {
      name: "Adv. Rajendra Kumar Singh",
      email: "rajendra@lexfirm.com",
      password: advocatePwd,
      role: "SENIOR_ADVOCATE",
      phone: "+91 98765 43210",
      isActive: true,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "client@demo.com" },
    update: {},
    create: {
      name: "Ramesh Kumar Sharma",
      email: "client@demo.com",
      password: clientPwd,
      role: "CLIENT",
      phone: "+91 99887 76655",
      isActive: true,
    },
  });

  // ── Employees ──────────────────────────────────────────────────────
  await prisma.employee.upsert({
    where: { userId: seniorAdvocate.id },
    update: {},
    create: {
      employeeId: "EMP-001",
      userId: seniorAdvocate.id,
      department: "Litigation",
      designation: "Senior Advocate",
      barCouncilNo: "BH/001/1999",
      joiningDate: new Date("2000-01-15"),
      salary: 150000,
    },
  });

  // ── Client ──────────────────────────────────────────────────────────
  const client = await prisma.client.upsert({
    where: { clientId: "CLT-DEMO-001" },
    update: {},
    create: {
      clientId: "CLT-DEMO-001",
      userId: clientUser.id,
      name: "Ramesh Kumar Sharma",
      mobile: "+91 99887 76655",
      email: "client@demo.com",
      city: "Patna",
      state: "Bihar",
      clientType: "INDIVIDUAL",
      occupation: "Business",
      referenceSource: "REFERRAL",
      isActive: true,
    },
  });

  // ── Testimonials ────────────────────────────────────────────────────
  const testimonials = [
    { clientName: "Ramesh Prasad", designation: "Business Owner, Patna", content: "Adv. Singh handled my property dispute with exceptional skill. What other lawyers said was hopeless, he won in just 8 months.", rating: 5 },
    { clientName: "Priya Sharma", designation: "Government Employee, Gaya", content: "The team managed my divorce and custody case with immense sensitivity. They fought hard for my rights while keeping my children's welfare first.", rating: 5 },
    { clientName: "Amit Kumar", designation: "Entrepreneur, Bhagalpur", content: "Got bail within 48 hours when we thought there was no hope. Professional, dedicated, and trustworthy.", rating: 5 },
  ];

  for (const t of testimonials) {
    await prisma.testimonial.create({ data: { ...t, isPublished: true } });
  }

  // ── News Updates ────────────────────────────────────────────────────
  await prisma.newsUpdate.create({
    data: {
      title: "Supreme Court Clarifies Bail Conditions Under UAPA",
      content: "The Supreme Court bench delivered a significant ruling clarifying bail conditions under UAPA cases, emphasizing proportionality and individual liberty.",
      category: "LEGAL_UPDATE",
      isPublished: true,
    },
  });

  // ── Court Holidays ──────────────────────────────────────────────────
  const holidays = [
    { date: new Date("2026-10-24"), name: "Dussehra", type: "NATIONAL" },
    { date: new Date("2026-11-01"), name: "Diwali", type: "NATIONAL" },
    { date: new Date("2026-11-15"), name: "Jharkhand Foundation Day", type: "STATE" },
    { date: new Date("2026-12-25"), name: "Christmas", type: "NATIONAL" },
    { date: new Date("2026-01-26"), name: "Republic Day", type: "NATIONAL" },
  ];

  for (const h of holidays) {
    await prisma.courtHoliday.create({ data: h });
  }

  console.log("✅ Database seeded successfully!");
  console.log("\n📧 Demo credentials:");
  console.log("   Super Admin:  admin@lexfirm.com    /  Admin@123");
  console.log("   Advocate:     rajendra@lexfirm.com /  Advocate@123");
  console.log("   Client:       client@demo.com      /  Client@123");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
