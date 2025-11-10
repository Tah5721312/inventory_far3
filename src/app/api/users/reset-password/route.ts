import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/database";

export async function POST(req: NextRequest) {
  let connection;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required" }, { status: 400 });
    }

    // ✅ Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    connection = await getConnection();

    // Log the received email for debugging
    console.log('Looking for user with email:', email);

    // Check if user exists (case-insensitive)
    const result = await connection.execute<{ USER_ID: number; EMAIL: string }>(
      `SELECT USER_ID, EMAIL FROM far3.USERS WHERE UPPER(EMAIL) = UPPER(:email)`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const user = result.rows?.[0];
    console.log('Database result:', user ? 'User found' : 'No user found');
    
    if (!user) {
      // Log available emails for debugging in development
      if (process.env.NODE_ENV === 'development') {
        const allUsers = await connection.execute(
          `SELECT EMAIL FROM far3.USERS`,
          {},
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log('Available emails in database:', allUsers.rows);
      }
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Update password using the exact email case from the database
    await connection.execute(
      `UPDATE far3.USERS SET PASSWORD = :password WHERE EMAIL = :email`,
      { 
        password: hashedPassword, 
        email: user.EMAIL // Use the email case from the database
      },
      { autoCommit: true }
    );

    return NextResponse.json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}