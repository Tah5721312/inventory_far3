// app/api/item-types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getAllItemTypes, createItemType } from '@/lib/db_utils';

export async function GET() {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const itemTypes = await getAllItemTypes();
    return NextResponse.json({ success: true, data: itemTypes });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching item types:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب أنواع الأصناف', details: errorMessage },
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
    const { ITEM_TYPE_NAME, SUB_CAT_ID } = body;

    if (!ITEM_TYPE_NAME || !SUB_CAT_ID) {
      return NextResponse.json(
        { success: false, error: 'الرجاء إدخال جميع البيانات المطلوبة' },
        { status: 400 }
      );
    }

    const newItemTypeId = await createItemType({
      ITEM_TYPE_NAME: ITEM_TYPE_NAME.trim(),
      SUB_CAT_ID: parseInt(SUB_CAT_ID),
    });

    return NextResponse.json({
      success: true,
      data: { ITEM_TYPE_ID: newItemTypeId },
      message: 'تم إضافة نوع الصنف بنجاح',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating item type:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد نوع صنف بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد نوع صنف بنفس الاسم في هذا التصنيف الفرعي بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة نوع الصنف', details: errorMessage },
      { status: 500 }
    );
  }
}
