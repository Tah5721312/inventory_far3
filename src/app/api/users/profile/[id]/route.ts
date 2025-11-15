import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateUserSchema } from "@/lib/validationSchemas";
import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/database";
import oracledb from "oracledb";

/**
 *  @method  DELETE
 *  @route   ~/api/users/profile/:id
 *  @desc    Delete Profile
 *  @access  private (only user himself can delete his account)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    connection = await getConnection();
    const { id } = await params;

    // ✅ تحقق هل المستخدم موجود
    const result = await connection.execute(
      `SELECT USER_ID AS ID, USERNAME, EMAIL FROM far3.USERS WHERE USER_ID = :id`,
      { id: Number(id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = result.rows?.[0] as { ID: number; USERNAME: string; EMAIL: string } | undefined;

    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    // ✅ تحقق من الجلسة
    const session = await auth();
    if (session?.user && (Number((session.user as any).id) === user.ID || (session.user as any).isAdmin)) {
      const deleteRes = await connection.execute(
        `DELETE FROM far3.USERS WHERE USER_ID = :id`,
        { id: Number(id) },
        { autoCommit: true }
      );
      if (deleteRes.rowsAffected && deleteRes.rowsAffected > 0) {
        return NextResponse.json({ message: "your profile has been deleted" }, { status: 200 });
      }
    }

    return NextResponse.json(
      { message: "only user himself can delete his profile" },
      { status: 403 }
    );
  } catch (error) {
    console.error("DELETE PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}

/**
 *  @method  GET
 *  @route   ~/api/users/profile/:id
 *  @desc    Get Profile By Id
 *  @access  private
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    connection = await getConnection();
    const { id } = await params;
    const result = await connection.execute(
      `SELECT USER_ID AS ID, USERNAME, EMAIL, ROLE_ID, CREATED_AT FROM far3.USERS WHERE USER_ID = :id`,
      { id: Number(id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const user = result.rows?.[0] as { ID: number; USERNAME: string; EMAIL: string; ROLE_ID?: number; CREATED_AT?: string } | undefined;
    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    const session = await auth();
    if (!session?.user || (Number((session.user as any).id) !== user.ID && !(session.user as any).isAdmin)) {
      return NextResponse.json({ message: "access denied" }, { status: 403 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}

/**
 *  @method  PUT
 *  @route   ~/api/users/profile/:id
 *  @desc    Update Profile
 *  @access  private
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    connection = await getConnection();
    const { id } = await params;

    // ✅ تحقق من وجود المستخدم
    const result = await connection.execute(
      `SELECT USER_ID AS ID, USERNAME, EMAIL, PASSWORD FROM far3.USERS WHERE USER_ID = :id`,
      { id: Number(id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = result.rows?.[0] as { ID: number; USERNAME: string; EMAIL: string; PASSWORD: string } | undefined;
    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    // ✅ تحقق من الجلسة
    const session = await auth();
    if (!session?.user || Number(session.user.id) !== user.ID) {
      return NextResponse.json({ message: "access denied" }, { status: 403 });
    }

    // ✅ تحقق من البيانات
    const body = (await request.json()) ;
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.issues[0].message }, { status: 400 });
    }

    // ✅ تحديث البيانات
    let hashedPassword = user.PASSWORD;
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(body.password, salt);
    }

    const updateRes = await connection.execute(
      `UPDATE far3.USERS 
       SET USERNAME = :username, EMAIL = :email, PASSWORD = :password 
       WHERE USER_ID = :id`,
      {
        username: body.username || user.USERNAME,
        email: body.email || user.EMAIL,
        password: hashedPassword,
        id: Number(id),
      },
      { autoCommit: true }
    );

    if (updateRes.rowsAffected && updateRes.rowsAffected > 0) {
      return NextResponse.json(
        { id: user.ID, username: body.username || user.USERNAME, email: body.email || user.EMAIL },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ message: "update failed" }, { status: 400 });
    }
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}
