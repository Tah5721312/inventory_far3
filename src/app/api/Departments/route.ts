// app/api/departments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllDepartments, createDepartment } from '@/lib/db_utils';

export async function GET() {
  try {
    const departments = await getAllDepartments();
    return NextResponse.json({ success: true, data: departments }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching departments:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الأقسام', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { DEPT_NAME } = body;

    if (!DEPT_NAME || DEPT_NAME.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'اسم القسم مطلوب' },
        { status: 400 }
      );
    }

    const newDeptId = await createDepartment({ DEPT_NAME: DEPT_NAME.trim() });
    
    return NextResponse.json(
      { success: true, message: 'تم إنشاء القسم بنجاح', id: newDeptId },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating department:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء القسم', details: errorMessage },
      { status: 500 }
    );
  }
}