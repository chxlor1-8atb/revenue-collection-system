import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import { adminUsers } from "./schema"
import { eq } from "drizzle-orm"
import * as bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        
        const userResult = await db.select().from(adminUsers).where(eq(adminUsers.username, credentials.username as string)).limit(1);
        const user = userResult[0];
        
        if (!user) return null;
        
        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        
        if (isValid) {
          return { id: user.id.toString(), name: user.username, role: user.role, collectorId: user.collectorId };
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.role = user.role;
        // @ts-ignore
        token.collectorId = user.collectorId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.role = token.role as string;
        // @ts-ignore
        session.user.collectorId = token.collectorId as number | null;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
});
