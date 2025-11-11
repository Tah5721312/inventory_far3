// app/api/ranks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllRanks, createRank } from '@/lib/db_utils';

export async function GET() {
  try {
    const ranks = await getAllRanks();
    return NextResponse.json({ success: true, data: ranks }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching ranks:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الرتب', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { RANK_NAME } = body;

    if (!RANK_NAME || RANK_NAME.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'اسم الرتبة مطلوب' },
        { status: 400 }
      );
    }

    const newId = await createRank({ RANK_NAME: RANK_NAME.trim() });
    return NextResponse.json(
      { success: true, message: 'تم إنشاء الرتبة بنجاح', id: newId },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating rank:', errorMessage);
    
    // التحقق من نوع الخطأ
    const errorString = errorMessage.toLowerCase();
    if (errorString.includes('unique constraint') || errorString.includes('يوجد رتبة بنفس الاسم')) {
      return NextResponse.json(
        { success: false, error: 'يوجد رتبة بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.' },
        { status: 409 } // Conflict status code
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الرتبة', details: errorMessage },
      { status: 500 }
    );
  }
}
