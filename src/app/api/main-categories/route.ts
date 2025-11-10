// app/api/main-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllMainCategories,
  createMainCategory,
} from '@/lib/db_utils';

// GET: جلب جميع التصنيفات الرئيسية
export async function GET() {
  try {
    const categories = await getAllMainCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching main categories:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيفات' },
      { status: 500 }
    );
  }
}

// POST: إضافة تصنيف رئيسي جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { CAT_NAME } = body;

    if (!CAT_NAME || CAT_NAME.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف مطلوب' },
        { status: 400 }
      );
    }

    const newCatId = await createMainCategory({ CAT_NAME: CAT_NAME.trim() ,DESCRIPTION: body.DESCRIPTION.trim()});
    return NextResponse.json(
      { success: true, data: { CAT_ID: newCatId, CAT_NAME: CAT_NAME.trim() } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating main category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة التصنيف' },
      { status: 500 }
    );
  }
}
