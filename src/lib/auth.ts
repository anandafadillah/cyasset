import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { staff } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Username atau Email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const identifier = credentials?.identifier as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!identifier || !password) return null;

        const [user] = await db
          .select()
          .from(staff)
          .where(or(eq(staff.username, identifier), eq(staff.email, identifier)))
          .limit(1);

        if (!user || !user.isActive) return null;

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) return null;

        await db.update(staff).set({ lastLoginAt: new Date() }).where(eq(staff.id, user.id));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = (user as { username: string }).username;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      return session;
    },
  },
});
