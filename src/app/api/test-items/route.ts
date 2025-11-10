// app/api/test-items/route.ts
// اختبار تدريجي للـ query

import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const step = searchParams.get('step') || '1';

  try {
    let query = '';
    let description = '';

    switch (step) {
      case '1':
        // اختبار 1: جدول ITEMS فقط
        description = 'Step 1: Basic ITEMS table';
        query = `
          SELECT 
            ITEM_ID, ITEM_NAME, SERIAL, KIND, SITUATION, PROPERTIES,
            HDD, RAM, IP, COMP_NAME, USER_ID, DEPT_ID, FLOOR_ID, 
            SUB_CAT_ID, ITEM_TYPE_ID
          FROM far3.ITEMS 
          WHERE ROWNUM <= 5
        `;
        break;

      case '2':
        // اختبار 2: مع USERS JOIN
        description = 'Step 2: ITEMS + USERS join';
        query = `
          SELECT 
            i.ITEM_ID, i.ITEM_NAME,
            i.USER_ID, u.FULL_NAME as ASSIGNED_USER
          FROM far3.ITEMS i
          LEFT JOIN far3.USERS u ON i.USER_ID = u.USER_ID
          WHERE ROWNUM <= 5
        `;
        break;

      case '3':
        // اختبار 3: مع DEPARTMENTS JOIN
        description = 'Step 3: ITEMS + DEPARTMENTS join';
        query = `
          SELECT 
            i.ITEM_ID, i.ITEM_NAME,
            i.DEPT_ID, d.DEPT_NAME
          FROM far3.ITEMS i
          LEFT JOIN far3.DEPARTMENTS d ON i.DEPT_ID = d.DEPT_ID
          WHERE ROWNUM <= 5
        `;
        break;

      case '4':
        // اختبار 4: مع FLOORS JOIN
        description = 'Step 4: ITEMS + FLOORS join';
        query = `
          SELECT 
            i.ITEM_ID, i.ITEM_NAME,
            i.FLOOR_ID, f.FLOOR_NAME
          FROM far3.ITEMS i
          LEFT JOIN far3.FLOORS f ON i.FLOOR_ID = f.FLOOR_ID
          WHERE ROWNUM <= 5
        `;
        break;

      case '5':
        // اختبار 5: مع SUB_CATEGORIES JOIN
        description = 'Step 5: ITEMS + SUB_CATEGORIES join';
        query = `
          SELECT 
            i.ITEM_ID, i.ITEM_NAME,
            i.SUB_CAT_ID, sc.SUB_CAT_NAME
          FROM far3.ITEMS i
          LEFT JOIN far3.SUB_CATEGORIES sc ON i.SUB_CAT_ID = sc.SUB_CAT_ID
          WHERE ROWNUM <= 5
        `;
        break;

      case '6':
        // اختبار 6: مع MAIN_CATEGORIES JOIN
        description = 'Step 6: ITEMS + SUB_CATEGORIES + MAIN_CATEGORIES join';
        query = `
          SELECT 
            i.ITEM_ID, i.ITEM_NAME,
            i.SUB_CAT_ID, sc.SUB_CAT_NAME,
            mc.CAT_ID, mc.CAT_NAME as MAIN_CATEGORY_NAME
          FROM far3.ITEMS i
          LEFT JOIN far3.SUB_CATEGORIES sc ON i.SUB_CAT_ID = sc.SUB_CAT_ID
          LEFT JOIN far3.MAIN_CATEGORIES mc ON sc.CAT_ID = mc.CAT_ID
          WHERE ROWNUM <= 5
        `;
        break;

      case '7':
        // اختبار 7: مع ITEM_TYPES JOIN
        description = 'Step 7: ITEMS + ITEM_TYPES join';
        query = `
          SELECT 
            i.ITEM_ID, i.ITEM_NAME,
            i.ITEM_TYPE_ID, it.ITEM_TYPE_NAME
          FROM far3.ITEMS i
          LEFT JOIN far3.ITEM_TYPES it ON i.ITEM_TYPE_ID = it.ITEM_TYPE_ID
          WHERE ROWNUM <= 5
        `;
        break;

      case 'full':
        // اختبار 8: الـ query الكامل
        description = 'Step FULL: Complete query with all joins';
        query = `
          SELECT 
            i.ITEM_ID, 
            i.ITEM_NAME, 
            i.SERIAL, 
            i.KIND, 
            i.SITUATION, 
            i.PROPERTIES,
            i.HDD, 
            i.RAM, 
            i.IP, 
            i.COMP_NAME,
            i.USER_ID, 
            u.FULL_NAME as ASSIGNED_USER,
            i.DEPT_ID, 
            d.DEPT_NAME,
            i.FLOOR_ID, 
            f.FLOOR_NAME,
            i.SUB_CAT_ID, 
            sc.SUB_CAT_NAME,
            mc.CAT_ID, 
            mc.CAT_NAME as MAIN_CATEGORY_NAME,
            i.ITEM_TYPE_ID, 
            it.ITEM_TYPE_NAME
          FROM far3.ITEMS i
          LEFT JOIN far3.USERS u ON i.USER_ID = u.USER_ID
          LEFT JOIN far3.DEPARTMENTS d ON i.DEPT_ID = d.DEPT_ID
          LEFT JOIN far3.FLOORS f ON i.FLOOR_ID = f.FLOOR_ID
          LEFT JOIN far3.SUB_CATEGORIES sc ON i.SUB_CAT_ID = sc.SUB_CAT_ID
          LEFT JOIN far3.MAIN_CATEGORIES mc ON sc.CAT_ID = mc.CAT_ID
          LEFT JOIN far3.ITEM_TYPES it ON i.ITEM_TYPE_ID = it.ITEM_TYPE_ID
          WHERE ROWNUM <= 5
        `;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid step parameter',
          usage: 'Use ?step=1 to ?step=7 or ?step=full'
        });
    }

    console.log('🧪 Testing:', description);
    console.log('📝 Query:', query);

    const result = await executeQuery(query);

    return NextResponse.json({
      success: true,
      step,
      description,
      rowCount: result.rows.length,
      data: result.rows
    });

  } catch (error: any) {
    console.error('❌ Error in step', step);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.errorNum || error?.code);

    return NextResponse.json({
      success: false,
      step,
      error: error?.message || 'Unknown error',
      errorCode: error?.errorNum || error?.code,
      errorOffset: error?.offset,
      details: String(error)
    }, { status: 500 });
  }
}