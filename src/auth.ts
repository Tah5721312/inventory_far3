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
    maxAge: 15 * 60, // 15 minutes - session expires after 15 minutes
    updateAge: 60, // Update session every 60 seconds when user is active (to reset the 15-minute timer)
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // NextAuth يستخدم maxAge من session.maxAge تلقائياً للكوكيز
        // لجعل الكوكيز session-only (تختفي عند إغلاق المتصفح)،
        // نحتاج إلى عدم وضع maxAge في cookie options
        // لكن NextAuth يضيفه تلقائياً، لذلك سنستخدم callback لتعديل الكوكيز
      },
    },
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
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
    maxAge: 15 * 60, // 15 minutes to match session maxAge
  },
  callbacks: {
    async jwt({ token, user }) {
      // JWT callback يتم استدعاؤه بشكل متكرر - لا نضع console logs هنا
      if (user) {
        token.id = (user as any).id; // ✅ إضافة id للـ token
        token.userId = (user as any).id;
        token.isAdmin = (user as any).isAdmin ?? false;
        token.roleId = (user as any).roleId ?? 0;
        token.isGuest = (user as any).isGuest ?? false;
      }
      
      // NextAuth يدير انتهاء الجلسة تلقائياً بناءً على maxAge
      // updateAge يقوم بتحديث الجلسة كل 60 ثانية عند التفاعل
      // إذا لم يكن هناك تفاعل لمدة 15 دقيقة، الجلسة ستنتهي تلقائياً
      
      return token;
    },
    async session({ session, token }) {
      // Session callback يتم استدعاؤه بشكل متكرر - لا نضع console logs هنا
      session.user = {
        id: String((token as any).id ?? (token as any).userId ?? ""),
        userId: Number((token as any).userId ?? (token as any).id ?? 0),    //  ← إضافة userId في الجلسة أيضًا
        name: session.user?.name || "",
        email: session.user?.email || "",
        isAdmin: Boolean((token as any).isAdmin),
        roleId: Number((token as any).roleId ?? 0),
      } as any;
      
      return session;
    },
  },
  debug: false, // تعطيل debug logs لتجنب التكرار المفرط
});

export { GET as GETAuth, POST as POSTAuth };