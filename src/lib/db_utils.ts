import oracledb from 'oracledb';
import { executeQuery, executeReturningQuery, getConnection } from '@/lib/database';
import { Item, User, MainCategory, SubCategory, ItemType, Rank, Floor } from '@/lib/types'; // added Rank and Floor types

/**
 * جلب جميع الأصناف مع إمكانية الفلترة
 */

export async function getAllItems(filters?: {
  subCatId?: number;
  userId?: number;
  deptId?: number;
  serial?: string;
}) {
  let query = `
    SELECT 
      i.ITEM_ID, i.ITEM_NAME, i.SERIAL, i.KIND, i.SITUATION, i.PROPERTIES,
      i.HDD, i.RAM, i.IP, i.COMP_NAME, i.LOCK_NUM,
      i.USER_ID, u.FULL_NAME as ASSIGNED_USER,
      i.DEPT_ID, d.DEPT_NAME,
      i.FLOOR_ID, f.FLOOR_NAME,
      i.SUB_CAT_ID, sc.SUB_CAT_NAME,
      mc.CAT_ID, mc.CAT_NAME as MAIN_CATEGORY_NAME,
      i.ITEM_TYPE_ID, it.ITEM_TYPE_NAME
    FROM far3.ITEMS i
    LEFT JOIN far3.USERS u ON i.USER_ID = u.USER_ID
    LEFT JOIN far3.DEPARTMENTS d ON i.DEPT_ID = d.DEPT_ID
    LEFT JOIN far3.FLOORS f ON i.FLOOR_ID = f.FLOOR_ID
    LEFT JOIN far3.SUB_CATEGORIES sc ON i.SUB_CAT_ID = sc.SUB_CAT_ID
    LEFT JOIN far3.MAIN_CATEGORIES mc ON sc.CAT_ID = mc.CAT_ID
    LEFT JOIN far3.ITEM_TYPES it ON i.ITEM_TYPE_ID = it.ITEM_TYPE_ID
  `;

  const params: oracledb.BindParameters = {};
  const where: string[] = [];

  if (filters?.subCatId) {
    where.push('i.SUB_CAT_ID = :subCatId');
    params.subCatId = filters.subCatId;
  }
  if (filters?.userId) {
    where.push('i.USER_ID = :userId');
    params.userId = filters.userId;
  }
  if (filters?.deptId) {
    where.push('i.DEPT_ID = :deptId');
    params.deptId = filters.deptId;
  }
  if (filters?.serial) {
    where.push('i.SERIAL LIKE :serial');
    params.serial = `%${filters.serial}%`;
  }

  if (where.length > 0) {
    query += ` WHERE ${where.join(' AND ')}`;
  }

  query += ' ORDER BY i.ITEM_NAME';

  return executeQuery<Item>(query, params).then((result) => result.rows);
}

/**
 * جلب صنف by ID
 */
export async function getItemById(id: number) {
  const query = `
    SELECT 
      i.ITEM_ID, i.ITEM_NAME, i.SERIAL, i.KIND, i.SITUATION, i.PROPERTIES,
      i.HDD, i.RAM, i.IP, i.COMP_NAME, i.LOCK_NUM,
      i.USER_ID, u.FULL_NAME as ASSIGNED_USER,
      i.DEPT_ID, d.DEPT_NAME,
      i.FLOOR_ID, f.FLOOR_NAME,
      i.SUB_CAT_ID, sc.SUB_CAT_NAME,
      mc.CAT_ID, mc.CAT_NAME as MAIN_CATEGORY_NAME,
      i.ITEM_TYPE_ID, it.ITEM_TYPE_NAME
    FROM far3.ITEMS i
    LEFT JOIN far3.USERS u ON i.USER_ID = u.USER_ID
    LEFT JOIN far3.DEPARTMENTS d ON i.DEPT_ID = d.DEPT_ID
    LEFT JOIN far3.FLOORS f ON i.FLOOR_ID = f.FLOOR_ID
    LEFT JOIN far3.SUB_CATEGORIES sc ON i.SUB_CAT_ID = sc.SUB_CAT_ID
    LEFT JOIN far3.MAIN_CATEGORIES mc ON sc.CAT_ID = mc.CAT_ID
    LEFT JOIN far3.ITEM_TYPES it ON i.ITEM_TYPE_ID = it.ITEM_TYPE_ID
    WHERE i.ITEM_ID = :id
  `;
  return executeQuery<Item>(query, { id }).then((result) => result.rows[0] || null);
}

/**
 * إضافة صنف جديد
 */
export async function createItem(item: Omit<Item, 'ITEM_ID' | 'CREATED_AT' | 'UPDATED_AT'>) {
  const result = await executeReturningQuery<{ item_id: number }>(
    `
    INSERT INTO far3.ITEMS (
      ITEM_NAME, SUB_CAT_ID, ITEM_TYPE_ID, LOCK_NUM, SERIAL, KIND, SITUATION, 
      PROPERTIES, HDD, RAM, IP, COMP_NAME, USER_ID, DEPT_ID, FLOOR_ID
    ) VALUES (
      :item_name, :sub_cat_id, :item_type_id, :lock_num, :serial, :kind, :situation,
      :properties, :hdd, :ram, :ip, :comp_name, :user_id, :dept_id, :floor_id
    ) RETURNING ITEM_ID INTO :id`,
    {
      item_name: item.ITEM_NAME,
      sub_cat_id: item.SUB_CAT_ID || null,
      item_type_id: item.ITEM_TYPE_ID || null,
      lock_num: item.LOCK_NUM || null,
      serial: item.SERIAL || null,
      kind: item.KIND || null,
      situation: item.SITUATION || null,
      properties: item.PROPERTIES || null,
      hdd: item.HDD || null,
      ram: item.RAM || null,
      ip: item.IP || null,
      comp_name: item.COMP_NAME || null,
      user_id: item.USER_ID !== undefined ? item.USER_ID : null,
      dept_id: item.DEPT_ID || null,
      floor_id: item.FLOOR_ID || null,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    }
  );

  const outBinds = result.outBinds as any;
  const newItemId = Array.isArray(outBinds?.id) ? outBinds.id[0] : outBinds?.id;

  if (!newItemId) {
    throw new Error(`Failed to retrieve the new item ID. Received outBinds with id: ${outBinds?.id}`);
  }

  return newItemId;
}

/**
 * تحديث صنف
 */
export async function updateItem(id: number, item: Partial<Omit<Item, 'ITEM_ID'>>) {
  // Whitelist of valid updateable columns in the ITEMS table
  // Excludes read-only joined fields like ITEM_TYPE_NAME, ASSIGNED_USER, DEPT_NAME, etc.
  const validColumns = new Set([
    'ITEM_NAME',
    'SERIAL',
    'KIND',
    'SITUATION',
    'PROPERTIES',
    'HDD',
    'RAM',
    'IP',
    'COMP_NAME',
    'LOCK_NUM',
    'USER_ID',
    'DEPT_ID',
    'FLOOR_ID',
    'SUB_CAT_ID',
    'ITEM_TYPE_ID',
  ]);

  const setClauses: string[] = [];
  const bindParams: oracledb.BindParameters = { id };

  Object.entries(item).forEach(([key, value]) => {
    // Only allow whitelisted columns
    if (validColumns.has(key)) {
      // Allow null values (especially for USER_ID when item is in warehouse)
      if (value !== undefined) {
        const bindParamName = key;
        setClauses.push(`${key} = :${bindParamName}`);
        bindParams[bindParamName] = value === null ? null : value;
      }
    } else if (!validColumns.has(key) && value !== undefined) {
      // Log warning for unexpected columns
      console.warn(`updateItem: Ignoring non-whitelisted column "${key}"`);
    }
  });

  if (setClauses.length === 0) {
    return 0;
  }

  const query = `UPDATE far3.ITEMS SET ${setClauses.join(', ')}, UPDATED_AT = SYSDATE WHERE ITEM_ID = :id`;

  const result = await executeQuery(query, bindParams);
  return result.rowsAffected || 0;
}

/**
 * حذف صنف
 */
export async function deleteItem(id: number) {
  return executeQuery('DELETE FROM far3.ITEMS WHERE ITEM_ID = :id', { id })
    .then((result) => result.rowsAffected || 0);
}

// You can add more functions here for USERS, CATEGORIES, etc.
// following the same pattern.
// For example:

/**
 * جلب جميع المستخدمين
 */
export async function getAllUsers() {
  const query = `
    SELECT u.USER_ID, u.USERNAME, u.EMAIL, u.FULL_NAME, u.PHONE, u.IS_ACTIVE,
           r.NAME as ROLE_NAME, d.DEPT_NAME, k.RANK_NAME, f.FLOOR_NAME
    FROM far3.USERS u
    LEFT JOIN far3.ROLES r ON u.ROLE_ID = r.ROLE_ID
    LEFT JOIN far3.DEPARTMENTS d ON u.DEPT_ID = d.DEPT_ID
    LEFT JOIN far3.RANKS k ON u.RANK_ID = k.RANK_ID
    LEFT JOIN far3.FLOORS f ON u.FLOOR_ID = f.FLOOR_ID
    ORDER BY u.FULL_NAME
  `;
  return executeQuery<User>(query).then(result => result.rows);
}

export async function getUserById(id: number) {
    const query = `
    SELECT u.USER_ID, u.USERNAME, u.EMAIL, u.FULL_NAME, u.PHONE, u.IS_ACTIVE,
           r.NAME as ROLE_NAME, d.DEPT_NAME, k.RANK_NAME, f.FLOOR_NAME
    FROM far3.USERS u
    LEFT JOIN far3.ROLES r ON u.ROLE_ID = r.ROLE_ID
    LEFT JOIN far3.DEPARTMENTS d ON u.DEPT_ID = d.DEPT_ID
    LEFT JOIN far3.RANKS k ON u.RANK_ID = k.RANK_ID
    LEFT JOIN far3.FLOORS f ON u.FLOOR_ID = f.FLOOR_ID
    WHERE u.USER_ID = :id
  `;
    return executeQuery<User>(query, { id }).then(result => result.rows[0] || null);
}

export async function createUser(user: Omit<User, 'USER_ID'>) {
    const result = await executeReturningQuery<{ user_id: number }>(
        `INSERT INTO far3.USERS (USERNAME, EMAIL, FULL_NAME, PHONE, IS_ACTIVE, ROLE_ID, DEPT_ID, RANK_ID, FLOOR_ID) 
         VALUES (:username, :email, :full_name, :phone, :is_active, :role_id, :dept_id, :rank_id, :floor_id)
         RETURNING USER_ID INTO :id`,
        {
            username: user.USERNAME,
            email: user.EMAIL,
            full_name: user.FULL_NAME,
            phone: user.PHONE,
            is_active: user.IS_ACTIVE,
            role_id: user.ROLE_ID,
            dept_id: user.DEPT_ID,
            rank_id: user.RANK_ID,
            floor_id: user.FLOOR_ID,
            id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
    );
    const outBinds = result.outBinds as any;
    const newUserId = Array.isArray(outBinds?.id) ? outBinds.id[0] : outBinds?.id;
    if (!newUserId) {
        throw new Error(`Failed to retrieve the new user ID. Received outBinds with id: ${outBinds?.id}`);
    }
    return newUserId;
}

export async function updateUser(id: number, user: Partial<Omit<User, 'USER_ID'>>) {
    const setClauses: string[] = [];
    const bindParams: oracledb.BindParameters = { id };

    Object.entries(user).forEach(([key, value]) => {
        if (value !== undefined) {
            const bindParamName = key.toLowerCase();
            setClauses.push(`${key} = :${bindParamName}`);
            bindParams[bindParamName] = value;
        }
    });

    if (setClauses.length === 0) {
        return 0;
    }

    const query = `UPDATE far3.USERS SET ${setClauses.join(', ')} WHERE USER_ID = :id`;
    const result = await executeQuery(query, bindParams);
    return result.rowsAffected || 0;
}

export async function deleteUser(id: number) {
    const query = `DELETE FROM far3.USERS WHERE USER_ID = :id`;
    const result = await executeQuery(query, { id });
    return result.rowsAffected || 0;
}



/*//====================

Sub_Categories CRUD operations

*///====================


export async function getAllSubCategories() {
    const query = `
      SELECT sc.SUB_CAT_ID, sc.SUB_CAT_NAME, sc.CAT_ID, sc.DESCRIPTION,
             mc.CAT_NAME
      FROM far3.SUB_CATEGORIES sc
      LEFT JOIN far3.MAIN_CATEGORIES mc ON sc.CAT_ID = mc.CAT_ID
      ORDER BY sc.SUB_CAT_NAME`;
    return executeQuery<any>(query).then(result => result.rows);
}

export async function getSubCategoryById(id: number) {
    const query = `
      SELECT sc.SUB_CAT_ID, sc.SUB_CAT_NAME, sc.CAT_ID, sc.DESCRIPTION,
             mc.CAT_NAME
      FROM far3.SUB_CATEGORIES sc
      LEFT JOIN far3.MAIN_CATEGORIES mc ON sc.CAT_ID = mc.CAT_ID
      WHERE sc.SUB_CAT_ID = :id`;
    return executeQuery<any>(query, { id }).then(result => result.rows[0] || null);
}


export async function createSubCategory(subCategory: { 
  SUB_CAT_NAME: string; 
  CAT_ID: number; 
  DESCRIPTION?: string 
}) {
    const result = await executeReturningQuery<{ sub_cat_id: number }>(
        `INSERT INTO far3.SUB_CATEGORIES (SUB_CAT_NAME, CAT_ID, DESCRIPTION) 
         VALUES (:sub_cat_name, :cat_id, :description) 
         RETURNING SUB_CAT_ID INTO :id`,
        {
            sub_cat_name: subCategory.SUB_CAT_NAME,
            cat_id: subCategory.CAT_ID,
            description: subCategory.DESCRIPTION || null,
            id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
    );
    const outBinds = result.outBinds as any;
    const newSubCatId = Array.isArray(outBinds?.id) ? outBinds.id[0] : outBinds?.id;
    if (!newSubCatId) {
        throw new Error(`Failed to retrieve the new sub category ID. Received outBinds with id: ${outBinds?.id}`);
    }
    return newSubCatId;
}

export async function updateSubCategory(id: number, subCategory: { SUB_CAT_NAME?: string; CAT_ID?: number ; DESCRIPTION?: string }) {
    const setClauses: string[] = [];
    const bindParams: oracledb.BindParameters = { id };

    if (subCategory.SUB_CAT_NAME !== undefined) {
        setClauses.push('SUB_CAT_NAME = :sub_cat_name');
        bindParams.sub_cat_name = subCategory.SUB_CAT_NAME;
    }
    if (subCategory.CAT_ID !== undefined) {
        setClauses.push('CAT_ID = :cat_id');
        bindParams.cat_id = subCategory.CAT_ID;
    }  
     if (subCategory.DESCRIPTION !== undefined) {
        setClauses.push('DESCRIPTION = :DESCRIPTION');
        bindParams.DESCRIPTION = subCategory.DESCRIPTION;
    }

    if (setClauses.length === 0) {
        return 0;
    }

    const query = `UPDATE far3.SUB_CATEGORIES SET ${setClauses.join(', ')} WHERE SUB_CAT_ID = :id`;
    const result = await executeQuery(query, bindParams);
    return result.rowsAffected || 0;
}

export async function deleteSubCategory(id: number) {
    const query = `DELETE FROM far3.SUB_CATEGORIES WHERE SUB_CAT_ID = :id`;
    const result = await executeQuery(query, { id });
    return result.rowsAffected || 0;
}



/*//====================

// Main_Categories CRUD operations

*///====================



export async function getAllMainCategories() {
    const query = `SELECT CAT_ID, CAT_NAME, DESCRIPTION FROM far3.MAIN_CATEGORIES ORDER BY CAT_NAME`;
    return executeQuery<any>(query).then(result => result.rows);
}

export async function getMainCategoryById(id: number) {
    const query = `SELECT CAT_ID, CAT_NAME, DESCRIPTION FROM far3.MAIN_CATEGORIES WHERE CAT_ID = :id`;
    return executeQuery<any>(query, { id }).then(result => result.rows[0] || null);
}

export async function createMainCategory(mainCategory: { CAT_NAME: string, DESCRIPTION: string }) {
    const result = await executeReturningQuery<{ cat_id: number }>(
        `INSERT INTO far3.MAIN_CATEGORIES (CAT_NAME ,DESCRIPTION) VALUES (:cat_name, :description) RETURNING CAT_ID INTO :id`,
        {
            cat_name: mainCategory.CAT_NAME,
            description: mainCategory.DESCRIPTION,
            id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
    );
    const outBinds = result.outBinds as any;
    const newCatId = Array.isArray(outBinds?.id) ? outBinds.id[0] : outBinds?.id;
    if (!newCatId) {
        throw new Error(`Failed to retrieve the new main category ID. Received outBinds with id: ${outBinds?.id}`);
    }
    return newCatId;
}
export async function updateMainCategory(
  id: number,
  mainCategory: { CAT_NAME?: string; DESCRIPTION?: string }
) {
  const setClauses: string[] = [];
  const bindParams: oracledb.BindParameters = { id };

  if (mainCategory.CAT_NAME !== undefined) {
    setClauses.push('CAT_NAME = :cat_name');
    bindParams.cat_name = mainCategory.CAT_NAME;
  }

  if (mainCategory.DESCRIPTION !== undefined) {
    setClauses.push('DESCRIPTION = :DESCRIPTION');
    bindParams.DESCRIPTION = mainCategory.DESCRIPTION;
  }

  if (setClauses.length === 0) {
    return 0; // مفيش حاجة تتحدث
  }

  const query = `
    UPDATE far3.MAIN_CATEGORIES 
    SET ${setClauses.join(', ')} 
    WHERE CAT_ID = :id
  `;

  const result = await executeQuery(query, bindParams);
  return result.rowsAffected || 0;
}

export async function deleteMainCategory(id: number) {
    const query = `DELETE FROM far3.MAIN_CATEGORIES WHERE CAT_ID = :id`;
    const result = await executeQuery(query, { id });
    return result.rowsAffected || 0;
}



/*//====================

// ITEM_TYPES CRUD operations

*///====================


export async function getAllItemTypes() {
    const query = `SELECT ITEM_TYPE_ID, ITEM_TYPE_NAME, SUB_CAT_ID FROM far3.ITEM_TYPES ORDER BY ITEM_TYPE_NAME`;
    return executeQuery<any>(query).then(result => result.rows);
}

export async function getItemTypeById(id: number) {
    const query = `SELECT ITEM_TYPE_ID, ITEM_TYPE_NAME, SUB_CAT_ID FROM far3.ITEM_TYPES WHERE ITEM_TYPE_ID = :id`;
    return executeQuery<any>(query, { id }).then(result => result.rows[0] || null);
}

export async function createItemType(itemType: { ITEM_TYPE_NAME: string; SUB_CAT_ID: number }) {
    const result = await executeReturningQuery<{ item_type_id: number }>(
        `INSERT INTO far3.ITEM_TYPES (ITEM_TYPE_NAME, SUB_CAT_ID) VALUES (:item_type_name, :sub_cat_id) RETURNING ITEM_TYPE_ID INTO :id`,
        {
            item_type_name: itemType.ITEM_TYPE_NAME,
            sub_cat_id: itemType.SUB_CAT_ID,
            id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
    );
    const outBinds = result.outBinds as any;
    const newItemTypeId = Array.isArray(outBinds?.id) ? outBinds.id[0] : outBinds?.id;
    if (!newItemTypeId) {
        throw new Error(`Failed to retrieve the new item type ID. Received outBinds with id: ${outBinds?.id}`);
    }
    return newItemTypeId;
}

export async function updateItemType(id: number, itemType: { ITEM_TYPE_NAME?: string; SUB_CAT_ID?: number }) {
    const setClauses: string[] = [];
    const bindParams: oracledb.BindParameters = { id };

    if (itemType.ITEM_TYPE_NAME !== undefined) {
        setClauses.push('ITEM_TYPE_NAME = :item_type_name');
        bindParams.item_type_name = itemType.ITEM_TYPE_NAME;
    }
    if (itemType.SUB_CAT_ID !== undefined) {
        setClauses.push('SUB_CAT_ID = :sub_cat_id');
        bindParams.sub_cat_id = itemType.SUB_CAT_ID;
    }

    if (setClauses.length === 0) {
        return 0;
    }

    const query = `UPDATE far3.ITEM_TYPES SET ${setClauses.join(', ')} WHERE ITEM_TYPE_ID = :id`;
    const result = await executeQuery(query, bindParams);
    return result.rowsAffected || 0;
}

export async function deleteItemType(id: number) {
    const query = `DELETE FROM far3.ITEM_TYPES WHERE ITEM_TYPE_ID = :id`;
    const result = await executeQuery(query, { id });
    return result.rowsAffected || 0;
}



/*//====================

// Departments CRUD operations

*///====================

export async function getAllDepartments() {
    const query = `SELECT DEPT_ID, DEPT_NAME FROM far3.DEPARTMENTS ORDER BY DEPT_NAME`;
    return executeQuery<any>(query).then(result => result.rows);
}

export async function getDepartmentById(id: number) {
    const query = `SELECT DEPT_ID, DEPT_NAME FROM far3.DEPARTMENTS WHERE DEPT_ID = :id`;
    return executeQuery<any>(query, { id }).then(result => result.rows[0] || null);
}

export async function createDepartment(department: { DEPT_NAME: string }) {
  const nextIdResult = await executeQuery<{ NEXT_ID: number }>(
    `SELECT NVL(MAX(DEPT_ID),0) + 1 AS NEXT_ID FROM far3.DEPARTMENTS`
  );
  const nextId = nextIdResult.rows[0].NEXT_ID;

  const result = await executeReturningQuery<{ dept_id: number }>(
    `INSERT INTO far3.DEPARTMENTS (DEPT_ID, DEPT_NAME)
     VALUES (:dept_id, :dept_name)
     RETURNING DEPT_ID INTO :id`,
    {
      dept_id: nextId,
      dept_name: department.DEPT_NAME,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }
  );

  const outBinds = result.outBinds as any;
  return Array.isArray(outBinds?.id) ? outBinds.id[0] : outBinds?.id;
}


export async function updateDepartment(id: number, department: { DEPT_NAME?: string }) {
    const setClauses: string[] = [];
    const bindParams: oracledb.BindParameters = { id };

    if (department.DEPT_NAME !== undefined) {
        setClauses.push('DEPT_NAME = :dept_name');
        bindParams.dept_name = department.DEPT_NAME;
    }

    if (setClauses.length === 0) {
        return 0;
    }

    const query = `UPDATE far3.DEPARTMENTS SET ${setClauses.join(', ')} WHERE DEPT_ID = :id`;
    const result = await executeQuery(query, bindParams);
    return result.rowsAffected || 0;
}

export async function deleteDepartment(id: number) {
    const query = `DELETE FROM far3.DEPARTMENTS WHERE DEPT_ID = :id`;
    const result = await executeQuery(query, { id });
    return result.rowsAffected || 0;
}

/*//====================

// Ranks CRUD operations

*///====================

export async function getAllRanks() {
    const query = `SELECT RANK_ID, RANK_NAME FROM far3.RANKS ORDER BY RANK_NAME`;
    return executeQuery<any>(query).then(result => result.rows);
}

export async function getRankById(id: number) {
  const query = `SELECT RANK_ID, RANK_NAME FROM far3.RANKS WHERE RANK_ID = :id`;
  return executeQuery<Rank>(query, { id }).then(result => result.rows[0] || null);
}


export async function createRank(rank: { RANK_NAME: string }) {
  const nextIdResult = await executeQuery<{ NEXT_ID: number }>(
    `SELECT NVL(MAX(RANK_ID), 0) + 1 AS NEXT_ID FROM far3.RANKS`
  );
  const nextId = nextIdResult.rows[0].NEXT_ID;

  const result = await executeReturningQuery<{ rank_id: number }>(
    `INSERT INTO far3.RANKS (RANK_ID, RANK_NAME)
     VALUES (:rank_id, :rank_name)
     RETURNING RANK_ID INTO :id`,
    {
      rank_id: nextId,
      rank_name: rank.RANK_NAME,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }
  );

  const outBinds = result.outBinds as any;
  const newRankId = Array.isArray(outBinds?.id) ? outBinds.id[0] : outBinds?.id;
  return newRankId;
}


export async function updateRank(id: number, rank: { RANK_NAME?: string }) {
  const setClauses: string[] = [];
  const bindParams: oracledb.BindParameters = { id };

  if (rank.RANK_NAME !== undefined) {
    setClauses.push('RANK_NAME = :rank_name');
    bindParams.rank_name = rank.RANK_NAME;
  }

  if (setClauses.length === 0) {
    return 0;
  }

  const query = `UPDATE far3.RANKS SET ${setClauses.join(', ')} WHERE RANK_ID = :id`;
  const result = await executeQuery(query, bindParams);
  return result.rowsAffected || 0;
}

export async function deleteRank(id: number) {
  const query = `DELETE FROM far3.RANKS WHERE RANK_ID = :id`;
  const result = await executeQuery(query, { id });
  return result.rowsAffected || 0;
}

/*//====================

// Floors CRUD operations

*///====================

export async function getAllFloors() {
    const query = `SELECT FLOOR_ID, FLOOR_NAME FROM far3.FLOORS ORDER BY FLOOR_NAME`;
    return executeQuery<any>(query).then(result => result.rows);
}

export async function getFloorById(id: number) {
  const query = `SELECT FLOOR_ID, FLOOR_NAME FROM far3.FLOORS WHERE FLOOR_ID = :id`;
  return executeQuery<Floor>(query, { id }).then(result => result.rows[0] || null);
}


export async function createFloor(floor: { FLOOR_NAME: string }) {
  // أولاً نحصل على رقم جديد يساوي أكبر FLOOR_ID + 1
  const nextIdResult = await executeQuery<{ NEXT_ID: number }>(
    `SELECT NVL(MAX(FLOOR_ID), 0) + 1 AS NEXT_ID FROM far3.FLOORS`
  );

  const nextId = nextIdResult.rows[0].NEXT_ID;

  // الآن ندخل الصف مع تمرير FLOOR_ID يدويًا
  const result = await executeReturningQuery<{ floor_id: number }>(
    `INSERT INTO far3.FLOORS (FLOOR_ID, FLOOR_NAME)
     VALUES (:floor_id, :floor_name)
     RETURNING FLOOR_ID INTO :id`,
    {
      floor_id: nextId,
      floor_name: floor.FLOOR_NAME,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }
  );

  const outBinds = result.outBinds as any;
  const newFloorId = Array.isArray(outBinds?.id) ? outBinds.id[0] : outBinds?.id;

  if (!newFloorId) {
    throw new Error(`Failed to retrieve the new floor ID. Received outBinds with id: ${outBinds?.id}`);
  }

  return newFloorId;
}



export async function updateFloor(id: number, floor: { FLOOR_NAME?: string }) {
  const setClauses: string[] = [];
  const bindParams: oracledb.BindParameters = { id };

  if (floor.FLOOR_NAME !== undefined) {
    setClauses.push('FLOOR_NAME = :floor_name');
    bindParams.floor_name = floor.FLOOR_NAME;
  }

  if (setClauses.length === 0) {
    return 0;
  }

  const query = `UPDATE far3.FLOORS SET ${setClauses.join(', ')} WHERE FLOOR_ID = :id`;
  const result = await executeQuery(query, bindParams);
  return result.rowsAffected || 0;
}

export async function deleteFloor(id: number) {
  const query = `DELETE FROM far3.FLOORS WHERE FLOOR_ID = :id`;
  const result = await executeQuery(query, { id });
  return result.rowsAffected || 0;
}