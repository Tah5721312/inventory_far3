
// app/api/departments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentById, updateDepartment, deleteDepartment } from '@/lib/db_utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const department = await getDepartmentById(id);
    
    if (!department) {
      return NextResponse.json(
        { error: 'القسم غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(department, { status: 200 });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { error: 'فشل في جلب القسم' },
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
    const { DEPT_NAME } = body;

    if (!DEPT_NAME || DEPT_NAME.trim() === '') {
      return NextResponse.json(
        { error: 'اسم القسم مطلوب' },
        { status: 400 }
      );
    }

    const rowsAffected = await updateDepartment(id, { DEPT_NAME: DEPT_NAME.trim() });
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { success: true, message: 'تم تحديث القسم بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'القسم غير موجود' },
        { status: 404 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating department:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد قسم آخر بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد قسم آخر بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث القسم', details: errorMessage },
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
    const rowsAffected = await deleteDepartment(id);
    
    if (rowsAffected > 0) {
      return NextResponse.json(
        { message: 'تم حذف القسم بنجاح' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'القسم غير موجود' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'فشل في حذف القسم' },
      { status: 500 }
    );
  }
}