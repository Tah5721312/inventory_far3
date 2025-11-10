// app/api/sub-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSubCategories,
  createSubCategory,
} from '@/lib/db_utils';

// GET: جلب جميع التصنيفات الفرعية
export async function GET() {
  try {
    const subCategories = await getAllSubCategories();
    return NextResponse.json({ success: true, data: subCategories });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching sub categories:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيفات الفرعية', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST: إضافة تصنيف فرعي جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { SUB_CAT_NAME, CAT_ID, DESCRIPTION } = body;

    if (!SUB_CAT_NAME || SUB_CAT_NAME.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف الفرعي مطلوب' },
        { status: 400 }
      );
    }

    if (!CAT_ID || isNaN(CAT_ID)) {
      return NextResponse.json(
        { success: false, error: 'التصنيف الرئيسي مطلوب' },
        { status: 400 }
      );
    }

    const newSubCatId = await createSubCategory({
      SUB_CAT_NAME: SUB_CAT_NAME.trim(),
      CAT_ID: parseInt(CAT_ID),
      DESCRIPTION: DESCRIPTION?.trim() || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          SUB_CAT_ID: newSubCatId,
          SUB_CAT_NAME: SUB_CAT_NAME.trim(),
          CAT_ID: parseInt(CAT_ID),
          DESCRIPTION: DESCRIPTION?.trim() || null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating sub category:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة التصنيف الفرعي', details: errorMessage },
      { status: 500 }
    );
  }
}
