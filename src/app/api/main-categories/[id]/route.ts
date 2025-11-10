
// app/api/main-categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getMainCategoryById,
  updateMainCategory,
  deleteMainCategory,
} from '@/lib/db_utils';

// GET: جلب تصنيف واحد
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const category = await getMainCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Error fetching main category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيف' },
      { status: 500 }
    );
  }
}
// PUT: تحديث تصنيف
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { CAT_NAME, DESCRIPTION } = body;

    // التحقق من الاسم فقط (الوصف اختياري)
    if (!CAT_NAME || CAT_NAME.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'اسم التصنيف مطلوب' },
        { status: 400 }
      );
    }

    const rowsAffected = await updateMainCategory(id, {
      CAT_NAME: CAT_NAME.trim(),
      DESCRIPTION: DESCRIPTION?.trim() || null, // ✅ هنا نضيف الوصف
    });

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        CAT_ID: id,
        CAT_NAME: CAT_NAME.trim(),
        DESCRIPTION: DESCRIPTION?.trim() || null,
      },
    });
  } catch (error) {
    console.error('Error updating main category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث التصنيف' },
      { status: 500 }
    );
  }
}


// DELETE: حذف تصنيف
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const rowsAffected = await deleteMainCategory(id);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف التصنيف بنجاح',
    });
  } catch (error) {
    console.error('Error deleting main category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التصنيف' },
      { status: 500 }
    );
  }
}