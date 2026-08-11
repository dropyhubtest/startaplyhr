import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        console.log(`🔑 Login Attempt: [${normalizedEmail}]`)

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        })

        if (!user) {
          console.log(`❌ Login Failed: User not found for [${normalizedEmail}]`)
          return null
        }

        if (!user.isActive) {
          console.log(`❌ Login Failed: Account inactive for [${normalizedEmail}]`)
          throw new Error("Account is inactive. Please contact HR.")
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          console.log(`❌ Login Failed: Password mismatch for [${normalizedEmail}]`)
          return null
        }

        console.log(`✅ Login Successful: [${normalizedEmail}] (${user.role})`)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          employeeId: user.employeeId,
          department: user.department,
          jobTitle: user.jobTitle,
          profilePhoto: user.profilePhoto,
          isFirstLogin: user.isFirstLogin,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.employeeId = user.employeeId
        token.isFirstLogin = user.isFirstLogin
      }
      // When updateSession() is called from the client, re-fetch from DB
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isFirstLogin: true, name: true, profilePhoto: true }
        })
        if (dbUser) {
          token.isFirstLogin = dbUser.isFirstLogin
          token.name = dbUser.name
          token.picture = dbUser.profilePhoto
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.employeeId = token.employeeId as string;
        session.user.isFirstLogin = token.isFirstLogin as boolean;
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
