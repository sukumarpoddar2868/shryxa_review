import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.BETTER_AUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        // 1. Validate the submitted credentials.

        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        if (!email || !password) {
          return null;
        }

        // 2. Find the user in PostgreSQL.

        const user = await prisma.user.findUnique({
          where: {
            email,
          },

          include: {
            role: true,
          },
        });

        // 3. Reject unknown users.

        if (!user) {
          return null;
        }

        // 4. Compare the submitted password with its stored hash.

        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        // 5. Return the authenticated user's safe information.

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role.name,
        };
      },
    }),
  ],

  callbacks: {
    // Called when Auth.js creates or updates the JWT.

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    // Controls which information is exposed through the session.

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },
});
