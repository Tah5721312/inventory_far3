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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching main categories:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيفات', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST: إضافة تصنيف رئيسي جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { CAT_NAME, DESCRIPTION } = body;

    if (!CAT_NAME || CAT_NAME.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف مطلوب' },
        { status: 400 }
      );
    }

    if (!DESCRIPTION || DESCRIPTION.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'الوصف مطلوب' },
        { status: 400 }
      );
    }

    const newCatId = await createMainCategory({ 
      CAT_NAME: CAT_NAME.trim(),
      DESCRIPTION: DESCRIPTION.trim()
    });
    return NextResponse.json(
      { success: true, data: { CAT_ID: newCatId, CAT_NAME: CAT_NAME.trim() } },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating main category:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة التصنيف', details: errorMessage },
      { status: 500 }
    );
  }
}
