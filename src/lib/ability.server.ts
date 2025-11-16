import 'server-only';
import { executeQuery } from '@/lib/database';
import { AbilityRule, Actions, Subjects, createAbilityFromRules, AppAbility } from '@/lib/ability';

type DbPermissionRow = {
  SUBJECT: string;
  ACTION: string;
  FIELD_NAME?: string | null;
  CAN_ACCESS?: number | null;
};

const subjectMap: Record<string, Subjects> = {
  ALL: 'all',
  USERS: 'User',
  USER: 'User',
  ITEMS: 'Item',
  ITEM: 'Item',
  CATEGORIES: 'Category',
  CATEGORY: 'Category',
  DEPARTMENTS: 'Department',
  DEPARTMENT: 'Department',
  RANKS: 'Rank',
  RANK: 'Rank',
  FLOORS: 'Floor',
  FLOOR: 'Floor',
  STATISTICS: 'Statistics',
  STATISTIC: 'Statistics',
  DASHBOARD: 'Dashboard',
  REPORTS: 'Reports',
  REPORT: 'Reports',
};

const actionMap: Record<string, Actions> = {
  MANAGE: 'manage',
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

function mapDbRowsToRules(rows: DbPermissionRow[]): AbilityRule[] {
  const rules: AbilityRule[] = [];
  
  console.log('🔍 Mapping DB rows to rules:', rows);

  for (const row of rows) {
    const subjectKey = (row.SUBJECT || '').toUpperCase().trim();
    const actionKey = (row.ACTION || '').toUpperCase().trim();
    
    console.log(`📌 Processing: SUBJECT="${subjectKey}", ACTION="${actionKey}", CAN_ACCESS=${row.CAN_ACCESS}`);
    
    // ✅ تحقق من CAN_ACCESS قبل أي شيء
    if (row.CAN_ACCESS === 0) {
      console.log(`❌ Skipping (CAN_ACCESS=0): ${actionKey} on ${subjectKey}`);
      continue;
    }
    
    // ✅ معالجة خاصة لـ manage all
    if (actionKey === 'MANAGE' && subjectKey === 'ALL') {
      console.log('✅ FOUND MANAGE ALL - Adding rule');
      rules.push({ action: 'manage', subject: 'all' });
      continue;
    }
    
    const mappedSubject = subjectMap[subjectKey];
    const mappedAction = actionMap[actionKey];
    
    if (!mappedSubject) {
      console.warn(`⚠️ Unknown subject: ${subjectKey}`);
      continue;
    }
    
    if (!mappedAction) {
      console.warn(`⚠️ Unknown action: ${actionKey}`);
      continue;
    }

    const rule: AbilityRule = {
      action: mappedAction,
      subject: mappedSubject,
    };

    if (row.FIELD_NAME && row.FIELD_NAME.trim() !== '') {
      rule.fields = row.FIELD_NAME;
    }

    console.log(`✅ Adding rule: ${mappedAction} on ${mappedSubject}`);
    rules.push(rule);
  }
  
  console.log('📊 Final rules:', rules);
  return rules;
}

export async function fetchAbilityRulesFromDB(userId: number): Promise<AbilityRule[]> {
  console.log(`🔍 Fetching permissions for user ${userId}`);
  
  // ✅ تحسين الـ Query - جلب ALL الصلاحيات بدون فلترة
  const sql = `
    SELECT DISTINCT
      rp.SUBJECT,
      rp.ACTION,
      rp.FIELD_NAME,
      COALESCE(rp.CAN_ACCESS, 1) as CAN_ACCESS
    FROM far3.USERS u
    INNER JOIN far3.ROLES r ON u.ROLE_ID = r.ROLE_ID
    LEFT JOIN far3.ROLE_PERMISSIONS rp ON r.ROLE_ID = rp.ROLE_ID
    WHERE u.USER_ID = :userId
    ORDER BY 
      CASE WHEN rp.SUBJECT = 'ALL' THEN 0 ELSE 1 END,
      rp.SUBJECT, 
      rp.ACTION
  `;

  const { rows } = await executeQuery<DbPermissionRow>(sql, { userId });
  
  console.log('📥 Raw DB rows:', rows);
  
  if (rows.length === 0) {
    console.warn(`⚠️ No permissions found for user ${userId}`);
  }
  
  return mapDbRowsToRules(rows);
}

export async function defineAbilityFromDB(userId: number): Promise<AppAbility> {
  // Handle guest user (ID = -1)
  if (userId === -1) {
    console.log('👤 Guest user detected');
    return defineGuestAbility();
  }
  
  const rules = await fetchAbilityRulesFromDB(userId);
  
  if (rules.length === 0) {
    console.warn(`⚠️ No rules found for user ${userId}, returning guest ability`);
    return defineGuestAbility();
  }
  
  console.log(`✅ Creating ability with ${rules.length} rules`);
  return createAbilityFromRules(rules);
}

export function defineGuestAbility(): AppAbility {
  const guestRules: AbilityRule[] = [
    { action: 'read', subject: 'Item' },
  ];
  return createAbilityFromRules(guestRules);
}