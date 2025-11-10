// =============================================================
// app/api/sub-categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
} from '@/lib/db_utils';

// GET: جلب تصنيف فرعي واحد
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const subCategory = await getSubCategoryById(id);

    if (!subCategory) {
      return NextResponse.json(
        { success: false, error: 'التصنيف الفرعي غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: subCategory });
  } catch (error) {
    console.error('Error fetching sub category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيف الفرعي' },
      { status: 500 }
    );
  }
}

// PUT: تحديث تصنيف فرعي
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
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

    const rowsAffected = await updateSubCategory(id, {
      SUB_CAT_NAME: SUB_CAT_NAME.trim(),
      CAT_ID: parseInt(CAT_ID),
      DESCRIPTION: DESCRIPTION?.trim() || undefined,
    });

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'التصنيف الفرعي غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        SUB_CAT_ID: id,
        SUB_CAT_NAME: SUB_CAT_NAME.trim(),
        CAT_ID: parseInt(CAT_ID),
        DESCRIPTION: DESCRIPTION?.trim() || null,
      },
    });
  } catch (error) {
    console.error('Error updating sub category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث التصنيف الفرعي' },
      { status: 500 }
    );
  }
}

// DELETE: حذف تصنيف فرعي
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const rowsAffected = await deleteSubCategory(id);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'التصنيف الفرعي غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف التصنيف الفرعي بنجاح',
    });
  } catch (error) {
    console.error('Error deleting sub category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التصنيف الفرعي' },
      { status: 500 }
    );
  }
}
