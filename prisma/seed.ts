import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // ─── Company Settings ─────────────────────────────────────────
  const settings = await prisma.companySettings.upsert({
    where: { id: "default-settings" },
    update: {},
    create: {
      id: "default-settings",
      companyName: "Startaply",
      workStartTime: "09:00",
      workEndTime: "18:00",
      lateThresholdMinutes: 30,
      maxBreakMinutes: 60,
      overtimeAfterMinutes: 540,
      defaultSickLeave: 10,
      defaultCasualLeave: 12,
      defaultPaidLeave: 15,
      defaultWFHLeave: 24,
    },
  })
  console.log("✅ Company settings created")

  // ─── Admin User ───────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@startaply.com" },
    update: {},
    create: {
      employeeId: "EMP000",
      name: "Admin User",
      email: "admin@startaply.com",
      password: adminPassword,
      role: "ADMIN",
      department: "HR",
      jobTitle: "HR Manager",
      phone: "+91 9876543210",
      salary: 100000,
      dateOfJoining: new Date("2023-01-01"),
      isActive: true,
      isFirstLogin: false,
    },
  })

  // Create leave balance for admin
  await prisma.leaveBalance.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      year: new Date().getFullYear(),
      sickLeave: 10,
      casualLeave: 12,
      paidLeave: 15,
      wfhLeave: 24,
    },
  })
  console.log("✅ Admin user created:", admin.email)

  // ─── Employees ────────────────────────────────────────────────
  const batmanPassword = await bcrypt.hash("Batman@123", 12)

  const employees = [
    {
      employeeId: "EMP001",
      name: "Batman",
      email: "batman@gmail.com",
      department: "Engineering",
      jobTitle: "Software Engineer",
      phone: "+91 9876543211",
      salary: 120000,
      dateOfJoining: new Date("2023-01-01"),
    },
  ]

  for (const emp of employees) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        ...emp,
        password: batmanPassword,
        role: "EMPLOYEE",
        isActive: true,
        isFirstLogin: false,
      },
    })

    // Create leave balance for each employee
    await prisma.leaveBalance.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        year: new Date().getFullYear(),
        sickLeave: 10,
        casualLeave: 12,
        paidLeave: 15,
        wfhLeave: 24,
      },
    })

    console.log("✅ Employee created:", user.email)
  }

  console.log("\n🎉 Seed completed successfully!")
  console.log("\n📋 Login Credentials:")
  console.log("  Admin:    admin@startaply.com / Admin@123")
  console.log("  Employee: batman@gmail.com / Batman@123")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
