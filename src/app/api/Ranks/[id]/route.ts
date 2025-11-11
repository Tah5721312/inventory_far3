
// app/api/ranks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRankById, updateRank, deleteRank } from '@/lib/db_utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const rank = await getRankById(id);
    
    if (!rank) {
      return NextResponse.json(
        { error: 'الرتبة غير موجودة' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(rank, { status: 200 });
  } catch (error) {
    console.error('Error fetching rank:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الرتبة' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { RANK_NAME } = body;

    if (!RANK_NAME || RANK_NAME.trim() === '') {
      return NextResponse.json(
        { error: 'اسم الرتبة مطلوب' },
        { status: 400 }
      );
    }

    const rowsAffected = await updateRank(id, { RANK_NAME: RANK_NAME.trim() });
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { success: true, message: 'تم تحديث الرتبة بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'الرتبة غير موجودة' },
        { status: 404 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating rank:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد رتبة أخرى بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد رتبة أخرى بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الرتبة', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const rowsAffected = await deleteRank(id);
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { message: 'تم حذف الرتبة بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'الرتبة غير موجودة' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting rank:', error);
    return NextResponse.json(
      { error: 'فشل في حذف الرتبة' },
      { status: 500 }
    );
  }
}