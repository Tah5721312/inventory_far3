import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { executeQuery } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id } = await params;
    const userId = parseInt(id);

    const query = `
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
      LEFT JOIN far3.ROLE_PERMISSIONS rp ON r.ROLE_ID = rp.ROLE_ID
      WHERE u.USER_ID = :userId
      GROUP BY u.USER_ID, u.USERNAME, u.EMAIL, u.PHONE, u.IS_ACTIVE, u.FULL_NAME, r.ROLE_ID, r.NAME, d.DEPT_ID, d.DEPT_NAME, k.RANK_ID, k.RANK_NAME, f.FLOOR_ID, f.FLOOR_NAME
    `;

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
    }>(query, { userId });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
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

    const user = {
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

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}


// ***************

// update user roles

// ***************

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();
    const { username, email, fullName, roleId, newUserId, phone, deptId, rankId, floorId, isActive } = body;

    // If the client requests changing the USER_ID, validate uniqueness first
    let effectiveUserId = userId;
    if (typeof newUserId === 'number' && newUserId !== userId) {
      const existsQuery = `
        SELECT COUNT(*) as count
        FROM far3.USERS
        WHERE USER_ID = :newUserId
      `;
      const existsResult = await executeQuery<{ count: number }>(existsQuery, { newUserId });
      if (existsResult.rows[0].count > 0) {
        return NextResponse.json(
          { error: 'USER_ID already exists' },
          { status: 409 }
        );
      }

      // Update the primary key first
      const updateIdQuery = `
        UPDATE far3.USERS
        SET USER_ID = :newUserId
        WHERE USER_ID = :userId
      `;
      await executeQuery(updateIdQuery, { newUserId, userId });
      effectiveUserId = newUserId;
    }

    // Build dynamic update query based on provided fields
    const updateFields: string[] = [];
    const updateParams: any = { effectiveUserId };

    if (username !== undefined) {
      updateFields.push('USERNAME = :username');
      updateParams.username = username;
    }
    if (email !== undefined) {
      updateFields.push('EMAIL = :email');
      updateParams.email = email;
    }
    if (fullName !== undefined) {
      updateFields.push('FULL_NAME = :fullName');
      updateParams.fullName = fullName;
    }
    if (roleId !== undefined) {
      updateFields.push('ROLE_ID = :roleId');
      updateParams.roleId = roleId;
    }
    if (phone !== undefined) {
      updateFields.push('PHONE = :phone');
      updateParams.phone = phone || null;
    }
    if (deptId !== undefined) {
      updateFields.push('DEPT_ID = :deptId');
      updateParams.deptId = deptId || null;
    }
    if (rankId !== undefined) {
      updateFields.push('RANK_ID = :rankId');
      updateParams.rankId = rankId || null;
    }
    if (floorId !== undefined) {
      updateFields.push('FLOOR_ID = :floorId');
      updateParams.floorId = floorId || null;
    }
    if (isActive !== undefined) {
      updateFields.push('IS_ACTIVE = :isActive');
      updateParams.isActive = isActive;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE far3.USERS 
      SET ${updateFields.join(', ')}
      WHERE USER_ID = :effectiveUserId
    `;

    await executeQuery(updateQuery, updateParams);

// when update user from nurse to super admin  
//   i refresh page to refresh الصلاحيات shown in page
// الحل 
    // Fetch updated user data with permissions
    const fetchQuery = `
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
      LEFT JOIN far3.ROLE_PERMISSIONS rp ON r.ROLE_ID = rp.ROLE_ID
      WHERE u.USER_ID = :effectiveUserId
      GROUP BY u.USER_ID, u.USERNAME, u.EMAIL, u.PHONE, u.IS_ACTIVE, u.FULL_NAME, r.ROLE_ID, r.NAME, d.DEPT_ID, d.DEPT_NAME, k.RANK_ID, k.RANK_NAME, f.FLOOR_ID, f.FLOOR_NAME
    `;

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
    }>(fetchQuery, { effectiveUserId });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found after update' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
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

    const updatedUser = {
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

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}


// ***************

// DELETE user roles

// ***************
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }
    
    const userId = parseInt(id);

    const query = `DELETE FROM far3.USERS WHERE USER_ID = :userId`;

    await executeQuery(query, { userId });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
