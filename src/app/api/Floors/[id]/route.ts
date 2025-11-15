// app/api/floors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFloorById, updateFloor, deleteFloor } from '@/lib/db_utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    const floor = await getFloorById(id);
    
    if (!floor) {
      return NextResponse.json(
        { error: 'الطابق غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(floor, { status: 200 });
  } catch (error) {
    console.error('Error fetching floor:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الطابق' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();
    const { FLOOR_NAME } = body;

    if (!FLOOR_NAME || FLOOR_NAME.trim() === '') {
      return NextResponse.json(
        { error: 'اسم الطابق مطلوب' },
        { status: 400 }
      );
    }

    const rowsAffected = await updateFloor(id, { FLOOR_NAME: FLOOR_NAME.trim() });
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { success: true, message: 'تم تحديث الطابق بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'الطابق غير موجود' },
        { status: 404 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating floor:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد طابق آخر بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد طابق آخر بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الطابق', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    const rowsAffected = await deleteFloor(id);
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { message: 'تم حذف الطابق بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'الطابق غير موجود' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting floor:', error);
    return NextResponse.json(
      { error: 'فشل في حذف الطابق' },
      { status: 500 }
    );
  }
}