import { NextRequest, NextResponse } from 'next/server';
import { getStatistics } from '@/lib/db_utils';

export async function GET(request: NextRequest) {
  try {
    const statistics = await getStatistics();
    
    return NextResponse.json({ 
      success: true, 
      data: statistics
    });
    
  } catch (error: any) {
    console.error('❌ Error in GET /api/statistics:', error);
    
    const errorMessage = error?.message || error?.name || 'Unknown error';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'فشل في جلب الإحصائيات',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

