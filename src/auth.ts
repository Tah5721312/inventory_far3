import 'server-only';

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/database";
import oracledb from "oracledb";

type OracleUser = {
  ID: number;
  USERNAME: string;
  EMAIL: string;
  PASSWORD: string;
  ROLE_ID?: number | null;
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true, // Trust localhost and other hosts in development
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: '/login', // تحديد صفحة الـ login
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = (creds?.email || "").toString().trim();
        const password = (creds?.password || "").toString();

        if (!email || !password) {
          return null;
        }

        let connection;
        try {
          connection = await getConnection();
          
          const result = await connection.execute<OracleUser>(
            `SELECT USER_ID AS ID, USERNAME, EMAIL, PASSWORD, ROLE_ID 
             FROM far3.USERS 
             WHERE UPPER(EMAIL) = UPPER(:email)`,
            { email },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );

          const user = result.rows?.[0];
          
          if (!user) {
            return null;
          }

          // إضافة معالجة خاصة للـ password
          const ok = await bcrypt.compare(password, user.PASSWORD);
          
          if (!ok) {
            return null;
          }

          const userSession = {
            id: String(user.ID),
            name: user.USERNAME,
            email: user.EMAIL,
            isAdmin: (user.ROLE_ID ?? 0) === 211,
            roleId: user.ROLE_ID ?? 0,
          };

          return userSession as any;

        } catch (err: any) {
          // تسجيل الأخطاء فقط في حالة وجود مشكلة فعلية
          console.error("❌ Authorization error:", err.message);
          return null;
        } finally {
          if (connection) {
            try {
              await connection.close();
            } catch (closeErr: any) {
              console.error("❌ Error closing connection:", closeErr.message);
            }
          }
        }
      },
    }),
  ],
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      // JWT callback يتم استدعاؤه بشكل متكرر - لا نضع console logs هنا
      if (user) {
        token.id = (user as any).id;
        token.isAdmin = (user as any).isAdmin ?? false;
        token.roleId = (user as any).roleId ?? 0;
        token.isGuest = (user as any).isGuest ?? false;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Session callback يتم استدعاؤه بشكل متكرر - لا نضع console logs هنا
      session.user = {
        id: String((token as any).id ?? ""),
        name: session.user?.name || "",
        email: session.user?.email || "",
        isAdmin: Boolean((token as any).isAdmin),
        roleId: Number((token as any).roleId ?? 0),
        isGuest: Boolean((token as any).isGuest),
      } as any;
      
      return session;
    },
  },
  debug: false, // تعطيل debug logs لتجنب التكرار المفرط
});

export { GET as GETAuth, POST as POSTAuth };