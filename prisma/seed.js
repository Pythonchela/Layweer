// Plain JS seed — works without ts-node
// Run: node prisma/seed.js  (after npx prisma db push)
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const superAdminPwd = await bcrypt.hash("Admin@123", 12);
  const advocatePwd   = await bcrypt.hash("Advocate@123", 12);
  const clientPwd     = await bcrypt.hash("Client@123", 12);

  // ── Super Admin ────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where:  { email: "admin@lexfirm.com" },
    update: {},
    create: {
      name:     "Super Administrator",
      email:    "admin@lexfirm.com",
      password: superAdminPwd,
      mustChangePassword: true,
      role:     "SUPER_ADMIN",
      phone:    "+91 98765 00000",
      isActive: true,
    },
  });
  console.log("  ✓ Super Admin created:", superAdmin.email);

  // ── Senior Advocate ────────────────────────────────────────────────
  const seniorAdvocate = await prisma.user.upsert({
    where:  { email: "rajendra@lexfirm.com" },
    update: {},
    create: {
      name:     "Adv. Rajendra Kumar Singh",
      email:    "rajendra@lexfirm.com",
      password: advocatePwd,
      mustChangePassword: true,
      role:     "SENIOR_ADVOCATE",
      phone:    "+91 98765 43210",
      isActive: true,
    },
  });
  console.log("  ✓ Senior Advocate created:", seniorAdvocate.email);

  // ── Employee record for Senior Advocate ───────────────────────────
  const existingEmp = await prisma.employee.findUnique({ where: { userId: seniorAdvocate.id } });
  if (!existingEmp) {
    await prisma.employee.create({
      data: {
        employeeId:    "EMP-001",
        userId:        seniorAdvocate.id,
        department:    "Litigation",
        designation:   "Senior Advocate",
        barCouncilNo:  "BH/001/1999",
        joiningDate:   new Date("2000-01-15"),
        salary:        150000,
      },
    });
    console.log("  ✓ Employee record created for Senior Advocate");
  }

  // ── Client User ────────────────────────────────────────────────────
  const clientUser = await prisma.user.upsert({
    where:  { email: "client@demo.com" },
    update: {},
    create: {
      name:     "Ramesh Kumar Sharma",
      email:    "client@demo.com",
      password: clientPwd,
      mustChangePassword: true,
      role:     "CLIENT",
      phone:    "+91 99887 76655",
      isActive: true,
    },
  });
  console.log("  ✓ Client user created:", clientUser.email);

  // ── Client record ──────────────────────────────────────────────────
  const existingClient = await prisma.client.findUnique({ where: { clientId: "CLT-DEMO-001" } });
  if (!existingClient) {
    await prisma.client.create({
      data: {
        clientId:        "CLT-DEMO-001",
        userId:          clientUser.id,
        name:            "Ramesh Kumar Sharma",
        mobile:          "+91 99887 76655",
        email:           "client@demo.com",
        city:            "Patna",
        state:           "Bihar",
        clientType:      "INDIVIDUAL",
        occupation:      "Business",
        referenceSource: "REFERRAL",
        isActive:        true,
      },
    });
    console.log("  ✓ Client record created");
  }

  // ── Testimonials ───────────────────────────────────────────────────
  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          clientName:  "Ramesh Prasad",
          designation: "Business Owner, Patna",
          content:     "Adv. Singh handled my property dispute with exceptional skill. What other lawyers said was hopeless, he won in just 8 months. Forever grateful.",
          rating:      5,
          isPublished: true,
        },
        {
          clientName:  "Priya Sharma",
          designation: "Government Employee, Gaya",
          content:     "The team managed my divorce and custody case with immense sensitivity. They fought hard for my rights.",
          rating:      5,
          isPublished: true,
        },
        {
          clientName:  "Amit Kumar",
          designation: "Entrepreneur, Bhagalpur",
          content:     "Got bail within 48 hours when we thought there was no hope. Professional, dedicated, and trustworthy.",
          rating:      5,
          isPublished: true,
        },
        {
          clientName:  "Sunita Devi",
          designation: "Teacher, Muzaffarpur",
          content:     "My cheque bounce case was dragging for 2 years. They took over and secured conviction plus full payment recovery within months.",
          rating:      5,
          isPublished: true,
        },
      ],
    });
    console.log("  ✓ Testimonials created");
  }

  // ── News Updates ───────────────────────────────────────────────────
  const newsCount = await prisma.newsUpdate.count();
  if (newsCount === 0) {
    await prisma.newsUpdate.createMany({
      data: [
        {
          title:       "Supreme Court Clarifies Bail Conditions Under UAPA",
          content:     "The Supreme Court bench delivered a significant ruling clarifying bail conditions under UAPA cases, emphasizing proportionality and individual liberty.",
          category:    "LEGAL_UPDATE",
          isPublished: true,
        },
        {
          title:       "New Amendment to CrPC: What It Means for Criminal Defendants",
          content:     "The Bharatiya Nagarik Suraksha Sanhita brings significant procedural changes for accused persons.",
          category:    "LEGISLATIVE_CHANGE",
          isPublished: true,
        },
      ],
    });
    console.log("  ✓ News updates created");
  }

  // ── Court Holidays ─────────────────────────────────────────────────
  const holidayCount = await prisma.courtHoliday.count();
  if (holidayCount === 0) {
    await prisma.courtHoliday.createMany({
      data: [
        { date: new Date("2026-10-24"), name: "Dussehra",                type: "NATIONAL" },
        { date: new Date("2026-11-01"), name: "Diwali",                  type: "NATIONAL" },
        { date: new Date("2026-11-15"), name: "Jharkhand Foundation Day", type: "STATE"    },
        { date: new Date("2026-12-25"), name: "Christmas",               type: "NATIONAL" },
        { date: new Date("2027-01-26"), name: "Republic Day",            type: "NATIONAL" },
        { date: new Date("2027-03-25"), name: "Holi",                    type: "NATIONAL" },
      ],
    });
    console.log("  ✓ Court holidays created");
  }

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📧 Demo Login Credentials:");
  console.log("   ┌──────────────────────┬───────────────────────────┬──────────────────┐");
  console.log("   │ Role                 │ Email                     │ Password         │");
  console.log("   ├──────────────────────┼───────────────────────────┼──────────────────┤");
  console.log("   │ Super Admin          │ admin@lexfirm.com         │ Admin@123        │");
  console.log("   │ Senior Advocate      │ rajendra@lexfirm.com      │ Advocate@123     │");
  console.log("   │ Client Portal        │ client@demo.com           │ Client@123       │");
  console.log("   └──────────────────────┴───────────────────────────┴──────────────────┘");
}

main()
  .catch((e) => {
    console.error("\n❌ Seed error:", e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
