// app/api/floors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';
import { getAllFloors, createFloor } from '@/lib/db_utils';

export async function GET() {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const floors = await getAllFloors();
    console.log('🏢 Fetched floors from DB:', floors);
    console.log('🏢 Number of floors:', floors?.length || 0);
    return NextResponse.json({ success: true, data: floors }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error fetching floors:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الطوابق', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ التحقق من تسجيل الدخول
    const authCheck = await requireAuth();
    if (authCheck) return authCheck;

    const body = await request.json();
    const { FLOOR_NAME } = body;

    if (!FLOOR_NAME || FLOOR_NAME.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'اسم الطابق مطلوب' },
        { status: 400 }
      );
    }

    const newId = await createFloor({ FLOOR_NAME: FLOOR_NAME.trim() });
    return NextResponse.json(
      { success: true, message: 'تم إنشاء الطابق بنجاح', id: newId },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating floor:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد طابق بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد طابق بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الطابق', details: errorMessage },
      { status: 500 }
    );
  }
}