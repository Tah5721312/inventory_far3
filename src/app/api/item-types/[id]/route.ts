// app/api/item-types/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getItemTypeById, updateItemType, deleteItemType } from '@/lib/db_utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id } = await params;
    const itemType = await getItemTypeById(parseInt(id));
    
    if (!itemType) {
      return NextResponse.json(
        { success: false, error: 'نوع الصنف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: itemType });
  } catch (error) {
    console.error('Error fetching item type:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب نوع الصنف' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id } = await params;
    const body = await request.json();
    const { ITEM_TYPE_NAME, SUB_CAT_ID } = body;

    const updateData: { ITEM_TYPE_NAME?: string; SUB_CAT_ID?: number } = {};
    
    if (ITEM_TYPE_NAME !== undefined) {
      updateData.ITEM_TYPE_NAME = ITEM_TYPE_NAME.trim();
    }
    if (SUB_CAT_ID !== undefined) {
      updateData.SUB_CAT_ID = parseInt(SUB_CAT_ID);
    }

    const rowsAffected = await updateItemType(parseInt(id), updateData);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'نوع الصنف غير موجود أو لم يتم التعديل' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث نوع الصنف بنجاح',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating item type:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد نوع صنف آخر بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد نوع صنف آخر بنفس الاسم في هذا التصنيف الفرعي بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث نوع الصنف', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const { id } = await params;
    const rowsAffected = await deleteItemType(parseInt(id));

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'نوع الصنف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف نوع الصنف بنجاح',
    });
  } catch (error) {
    console.error('Error deleting item type:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف نوع الصنف' },
      { status: 500 }
    );
  }
}
