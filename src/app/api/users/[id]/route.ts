import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { executeQuery } from '@/lib/database';
import { sanitizeInput, isValidText, isValidEmail } from '@/lib/security';

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
    
    // ✅ التحقق من صحة ID
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }

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
    
    // ✅ التحقق من صحة ID
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }

    const body = await request.json();
    let { username, email, fullName, phone } = body;
    const { roleId, newUserId, deptId, rankId, floorId, isActive } = body;

    // If the client requests changing the USER_ID, validate uniqueness first
    let effectiveUserId = userId;
    
    // Validate newUserId if provided
    if (typeof newUserId === 'number' && newUserId !== userId) {
      if (isNaN(newUserId) || newUserId <= 0) {
        return NextResponse.json(
          { error: 'معرف المستخدم الجديد غير صحيح' },
          { status: 400 }
        );
      }
      
      // Check if newUserId already exists
      const existsQuery = `
        SELECT COUNT(*) as count
        FROM far3.USERS
        WHERE USER_ID = :newUserId
      `;
      const existsResult = await executeQuery<{ count: number }>(existsQuery, { newUserId });
      if (existsResult.rows[0].count > 0) {
        return NextResponse.json(
          { error: 'معرف المستخدم موجود بالفعل' },
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
      if (typeof username !== 'string') {
        return NextResponse.json(
          { error: 'اسم المستخدم يجب أن يكون نص' },
          { status: 400 }
        );
      }
      
      username = sanitizeInput(username.trim());
      if (username === '') {
        return NextResponse.json(
          { error: 'اسم المستخدم لا يمكن أن يكون فارغاً' },
          { status: 400 }
        );
      }

      if (username.length > 100) {
        return NextResponse.json(
          { error: 'اسم المستخدم طويل جداً (الحد الأقصى 100 حرف)' },
          { status: 400 }
        );
      }

      if (!isValidText(username)) {
        return NextResponse.json(
          { error: 'اسم المستخدم يحتوي على أحرف غير مسموح بها' },
          { status: 400 }
        );
      }

      updateFields.push('USERNAME = :username');
      updateParams.username = username;
    }
    
    if (email !== undefined) {
      if (typeof email !== 'string') {
        return NextResponse.json(
          { error: 'البريد الإلكتروني يجب أن يكون نص' },
          { status: 400 }
        );
      }
      
      email = sanitizeInput(email.trim().toLowerCase());
      if (email === '') {
        return NextResponse.json(
          { error: 'البريد الإلكتروني لا يمكن أن يكون فارغاً' },
          { status: 400 }
        );
      }

      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني غير صحيح' },
          { status: 400 }
        );
      }

      if (email.length > 255) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني طويل جداً (الحد الأقصى 255 حرف)' },
          { status: 400 }
        );
      }

      updateFields.push('EMAIL = :email');
      updateParams.email = email;
    }
    
    if (fullName !== undefined) {
      if (typeof fullName !== 'string') {
        return NextResponse.json(
          { error: 'الاسم الكامل يجب أن يكون نص' },
          { status: 400 }
        );
      }
      
      fullName = sanitizeInput(fullName.trim());
      if (fullName === '') {
        return NextResponse.json(
          { error: 'الاسم الكامل لا يمكن أن يكون فارغاً' },
          { status: 400 }
        );
      }

      if (fullName.length > 200) {
        return NextResponse.json(
          { error: 'الاسم الكامل طويل جداً (الحد الأقصى 200 حرف)' },
          { status: 400 }
        );
      }

      if (!isValidText(fullName)) {
        return NextResponse.json(
          { error: 'الاسم الكامل يحتوي على أحرف غير مسموح بها' },
          { status: 400 }
        );
      }

      updateFields.push('FULL_NAME = :fullName');
      updateParams.fullName = fullName;
    }
    
    if (roleId !== undefined) {
      const roleIdNum = typeof roleId === 'string' ? parseInt(roleId) : Number(roleId);
      if (isNaN(roleIdNum) || roleIdNum <= 0) {
        return NextResponse.json(
          { error: 'الدور غير صحيح' },
          { status: 400 }
        );
      }
      updateFields.push('ROLE_ID = :roleId');
      updateParams.roleId = roleIdNum;
    }
    
    if (phone !== undefined) {
      if (phone === null || phone === '') {
        updateFields.push('PHONE = :phone');
        updateParams.phone = null;
      } else if (typeof phone === 'string') {
        phone = sanitizeInput(phone.trim());
        if (phone.length > 50) {
          return NextResponse.json(
            { error: 'رقم الهاتف طويل جداً (الحد الأقصى 50 حرف)' },
            { status: 400 }
          );
        }
        updateFields.push('PHONE = :phone');
        updateParams.phone = phone;
      } else {
        return NextResponse.json(
          { error: 'رقم الهاتف يجب أن يكون نص' },
          { status: 400 }
        );
      }
    }
    
    if (deptId !== undefined) {
      if (deptId === null || deptId === '') {
        updateFields.push('DEPT_ID = :deptId');
        updateParams.deptId = null;
      } else {
        const deptIdNum = typeof deptId === 'string' ? parseInt(deptId) : Number(deptId);
        if (isNaN(deptIdNum) || deptIdNum <= 0) {
          return NextResponse.json(
            { error: 'معرف القسم غير صحيح' },
            { status: 400 }
          );
        }
        updateFields.push('DEPT_ID = :deptId');
        updateParams.deptId = deptIdNum;
      }
    }
    
    if (rankId !== undefined) {
      if (rankId === null || rankId === '') {
        updateFields.push('RANK_ID = :rankId');
        updateParams.rankId = null;
      } else {
        const rankIdNum = typeof rankId === 'string' ? parseInt(rankId) : Number(rankId);
        if (isNaN(rankIdNum) || rankIdNum <= 0) {
          return NextResponse.json(
            { error: 'معرف الرتبة غير صحيح' },
            { status: 400 }
          );
        }
        updateFields.push('RANK_ID = :rankId');
        updateParams.rankId = rankIdNum;
      }
    }
    
    if (floorId !== undefined) {
      if (floorId === null || floorId === '') {
        updateFields.push('FLOOR_ID = :floorId');
        updateParams.floorId = null;
      } else {
        const floorIdNum = typeof floorId === 'string' ? parseInt(floorId) : Number(floorId);
        if (isNaN(floorIdNum) || floorIdNum <= 0) {
          return NextResponse.json(
            { error: 'معرف الطابق غير صحيح' },
            { status: 400 }
          );
        }
        updateFields.push('FLOOR_ID = :floorId');
        updateParams.floorId = floorIdNum;
      }
    }
    
    if (isActive !== undefined) {
      if (typeof isActive !== 'number' && typeof isActive !== 'string') {
        return NextResponse.json(
          { error: 'الحالة غير صحيحة' },
          { status: 400 }
        );
      }
      const isActiveNum = Number(isActive);
      if (isActiveNum !== 0 && isActiveNum !== 1) {
        return NextResponse.json(
          { error: 'الحالة يجب أن تكون 0 أو 1' },
          { status: 400 }
        );
      }
      updateFields.push('IS_ACTIVE = :isActive');
      updateParams.isActive = isActiveNum;
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
    const userId = parseInt(id);
    
    // ✅ التحقق من صحة ID
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }

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
