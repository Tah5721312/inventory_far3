// app/api/floors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllFloors, createFloor } from '@/lib/db_utils';

export async function GET() {
  try {
    const floors = await getAllFloors();
    return NextResponse.json({ success: true, data: floors }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching floors:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الطوابق', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الطابق', details: errorMessage },
      { status: 500 }
    );
  }
}