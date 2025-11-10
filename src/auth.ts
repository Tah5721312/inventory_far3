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
        console.log("🔐 Starting authorization...");
        
        const email = (creds?.email || "").toString().trim();
        const password = (creds?.password || "").toString();

        if (!email || !password) {
          console.error("❌ Missing credentials");
          return null;
        }

        let connection;
        try {
          console.log("📡 Getting database connection...");
          connection = await getConnection();
          
          console.log("🔍 Searching for user:", email);
          const result = await connection.execute<OracleUser>(
            `SELECT USER_ID AS ID, USERNAME, EMAIL, PASSWORD, ROLE_ID 
             FROM far3.USERS 
             WHERE UPPER(EMAIL) = UPPER(:email)`,
            { email },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );

          const user = result.rows?.[0];
          
          if (!user) {
            console.error("❌ User not found:", email);
            return null;
          }

          console.log("✅ User found:", user.EMAIL);
          console.log("🔑 Comparing passwords...");
          
          // إضافة معالجة خاصة للـ password
          const ok = await bcrypt.compare(password, user.PASSWORD);
          
          if (!ok) {
            console.error("❌ Password mismatch");
            return null;
          }

          console.log("✅ Password matched!");
          console.log("👤 Creating user session...");

          const userSession = {
            id: String(user.ID),
            name: user.USERNAME,
            email: user.EMAIL,
            isAdmin: (user.ROLE_ID ?? 0) === 211,
            roleId: user.ROLE_ID ?? 0,
          };

          console.log("✅ User session created:", userSession);
          return userSession as any;

        } catch (err: any) {
          console.error("❌ Authorization error:", err.message);
          console.error("Stack:", err.stack);
          return null;
        } finally {
          if (connection) {
            try {
              await connection.close();
              console.log("✅ Connection closed");
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
    async jwt({ token, user, trigger }) {
      console.log("🔄 JWT callback - trigger:", trigger);
      
      if (user) {
        console.log("✅ Adding user to token:", user);
        token.id = (user as any).id;
        token.isAdmin = (user as any).isAdmin ?? false;
        token.roleId = (user as any).roleId ?? 0;
        token.isGuest = (user as any).isGuest ?? false;
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log("🔄 Session callback");
      
      session.user = {
        id: String((token as any).id ?? ""),
        name: session.user?.name || "",
        email: session.user?.email || "",
        isAdmin: Boolean((token as any).isAdmin),
        roleId: Number((token as any).roleId ?? 0),
        isGuest: Boolean((token as any).isGuest),
      } as any;
      
      console.log("✅ Session created:", session.user);
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
});

export { GET as GETAuth, POST as POSTAuth };