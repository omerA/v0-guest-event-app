import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { signIn } from "@/auth"

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, email, password } = parsed.data

    // Check for existing user
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Generate unique ownerSlug from email prefix
    const base = slugify(email.split("@")[0])
    let ownerSlug = base
    let i = 1
    while (await db.user.findUnique({ where: { ownerSlug } })) {
      ownerSlug = `${base}-${i++}`
    }

    // Create user
    const user = await db.user.create({
      data: { name, email, passwordHash, ownerSlug },
    })

    // Sign in the new user
    await signIn("credentials", { email, password, redirect: false })

    return NextResponse.json({ userId: user.id, ownerSlug: user.ownerSlug }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) throw error
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
