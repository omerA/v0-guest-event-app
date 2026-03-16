import { db } from "@/lib/db"

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL
  if (!email) {
    console.log("SUPER_ADMIN_EMAIL not set, skipping seed")
    return
  }
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    await db.user.update({ where: { email }, data: { role: "superadmin" } })
    console.log(`Updated ${email} to superadmin`)
  } else {
    console.log(`User ${email} not found — they must sign up first, then re-run seed`)
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
