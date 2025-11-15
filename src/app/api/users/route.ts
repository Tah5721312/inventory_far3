import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { executeQuery } from '@/lib/database';
import bcrypt from 'bcryptjs';

// Interface for user with role and permissions
interface UserWithRolePermissions {
  USER_ID: number;
  USERNAME: string;
  FULL_NAME: string;
  EMAIL: string;
  PHONE?: string;
  IS_ACTIVE?: number;
  ROLE_ID?: number;
  ROLE_NAME?: string;
  DEPT_ID?: number;
  DEPT_NAME?: string;
  RANK_ID?: number;
  RANK_NAME?: string;
  FLOOR_ID?: number;
  FLOOR_NAME?: string;
  PERMISSIONS: {
    SUBJECT: string;
    ACTION: string;
    FIELD_NAME: string | null;
    CAN_ACCESS: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { searchParams } = new URL(request.url);
    const usernameFilter = searchParams.get('username') || '';
    const roleFilter = searchParams.get('role') || '';

    // Build the query to get users with their roles and permissions
    let query = `
      SELECT 
        u.USER_ID,
        u.USERNAME,
        u.EMAIL,
        u.PHONE,
        u.IS_ACTIVE,
        COALESCE(u.FULL_NAME, u.USERNAME) as FULL_NAME,
        r.ROLE_ID,
        r.NAME as ROLE_NAME,
        d.DEPT_ID,
        d.DEPT_NAME,
        k.RANK_ID,
        k.RANK_NAME,
        f.FLOOR_ID,
        f.FLOOR_NAME,
        LISTAGG(
          CASE 
            WHEN rp.SUBJECT IS NOT NULL THEN 
              rp.SUBJECT || '|' || rp.ACTION || '|' || COALESCE(rp.FIELD_NAME, '') || '|' || rp.CAN_ACCESS
            ELSE NULL
          END, ';'
        ) WITHIN GROUP (ORDER BY rp.SUBJECT, rp.ACTION) as PERMISSIONS_STRING
      FROM far3.USERS u
      LEFT JOIN far3.ROLES r ON u.ROLE_ID = r.ROLE_ID
      LEFT JOIN far3.DEPARTMENTS d ON u.DEPT_ID = d.DEPT_ID
      LEFT JOIN far3.RANKS k ON u.RANK_ID = k.RANK_ID
      LEFT JOIN far3.FLOORS f ON u.FLOOR_ID = f.FLOOR_ID
      LEFT JOIN far3.ROLE_PERMISSIONS rp ON r.ROLE_ID = rp.ROLE_ID AND r.ROLE_ID IS NOT NULL
    `;

    const conditions = [];
    const params: any = {};

    if (usernameFilter) {
      conditions.push('UPPER(u.USERNAME) LIKE UPPER(:usernameFilter)');
      params.usernameFilter = `%${usernameFilter}%`;
    }

    if (roleFilter) {
      conditions.push('r.NAME = :roleFilter');
      params.roleFilter = roleFilter;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY u.USER_ID, u.USERNAME, u.EMAIL, u.PHONE, u.IS_ACTIVE, u.FULL_NAME, 
               r.ROLE_ID, r.NAME, d.DEPT_ID, d.DEPT_NAME, k.RANK_ID, k.RANK_NAME, 
               f.FLOOR_ID, f.FLOOR_NAME
      ORDER BY u.USER_ID
    `;

    console.log('Executing query:', query);
    console.log('Query params:', params);

    const result = await executeQuery<{
      USER_ID: number;
      USERNAME: string;
      EMAIL: string;
      FULL_NAME: string;
      PHONE?: string;
      IS_ACTIVE?: number;
      ROLE_ID?: number;
      ROLE_NAME?: string;
      DEPT_ID?: number;
      DEPT_NAME?: string;
      RANK_ID?: number;
      RANK_NAME?: string;
      FLOOR_ID?: number;
      FLOOR_NAME?: string;
      PERMISSIONS_STRING?: string;
    }>(query, params);
    
    console.log('Query executed successfully, rows:', result.rows.length);

    // Transform the result to include permissions as an array
    const users: UserWithRolePermissions[] = result.rows.map(row => {
      const permissions: { SUBJECT: string; ACTION: string; FIELD_NAME: string | null; CAN_ACCESS: number }[] = [];
      
      if (row.PERMISSIONS_STRING) {
        const permissionStrings = row.PERMISSIONS_STRING.split(';');
        permissionStrings.forEach(permStr => {
          if (permStr.trim()) {
            const [subject, action, fieldName, canAccess] = permStr.split('|');
            permissions.push({
              SUBJECT: subject,
              ACTION: action,
              FIELD_NAME: fieldName || null,
              CAN_ACCESS: parseInt(canAccess) || 0
            });
          }
        });
      }

      return {
        USER_ID: row.USER_ID,
        USERNAME: row.USERNAME,
        FULL_NAME: row.FULL_NAME,
        EMAIL: row.EMAIL,
        PHONE: row.PHONE || undefined,
        IS_ACTIVE: row.IS_ACTIVE || undefined,
        ROLE_ID: row.ROLE_ID || undefined,
        ROLE_NAME: row.ROLE_NAME || undefined,
        DEPT_ID: row.DEPT_ID || undefined,
        DEPT_NAME: row.DEPT_NAME || undefined,
        RANK_ID: row.RANK_ID || undefined,
        RANK_NAME: row.RANK_NAME || undefined,
        FLOOR_ID: row.FLOOR_ID || undefined,
        FLOOR_NAME: row.FLOOR_NAME || undefined,
        PERMISSIONS: permissions
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    return NextResponse.json(
      { error: 'Failed to fetch users', details: errorMessage },
      { status: 500 }
    );
  }
}





export async function POST(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const body = await request.json();
    const { username, email, fullName, password, roleId, phone, deptId, rankId, floorId, isActive } = body;

    // Validate required fields
    if (!username || !email || !fullName || !password || !roleId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const checkUserQuery = `
      SELECT COUNT(*) as count FROM far3.USERS WHERE USERNAME = :username
    `;
    const checkResult = await executeQuery<{ count: number }>(checkUserQuery, { username });
    
    if (checkResult.rows[0].count > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const checkEmailQuery = `
      SELECT COUNT(*) as count FROM far3.USERS WHERE EMAIL = :email
    `;
    const checkEmailResult = await executeQuery<{ count: number }>(checkEmailQuery, { email });
    
    if (checkEmailResult.rows[0].count > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password using bcrypt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const insertQuery = `
      INSERT INTO far3.USERS (USERNAME, EMAIL, FULL_NAME, PASSWORD, ROLE_ID, IS_ACTIVE, PHONE, DEPT_ID, RANK_ID, FLOOR_ID)
      VALUES (:username, :email, :fullName, :password, :roleId, :isActive, :phone, :deptId, :rankId, :floorId)
    `;

    await executeQuery(insertQuery, {
      username,
      email,
      fullName,
      password: hashedPassword,
      roleId,
      isActive: isActive !== undefined ? isActive : 1,
      phone: phone || null,
      deptId: deptId || null,
      rankId: rankId || null,
      floorId: floorId || null
    });

    return NextResponse.json({ 
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
