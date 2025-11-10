// app/api/item-types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllItemTypes, createItemType } from '@/lib/db_utils';

export async function GET() {
  try {
    const itemTypes = await getAllItemTypes();
    return NextResponse.json({ success: true, data: itemTypes });
  } catch (error) {
    console.error('Error fetching item types:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب أنواع الأصناف' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    console.error('Error creating item type:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة نوع الصنف' },
      { status: 500 }
    );
  }
}
