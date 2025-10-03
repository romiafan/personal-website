import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const vitals = await request.json();
    
    // In development, just log the metrics
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vital:', {
        name: vitals.name,
        value: Math.round(vitals.value),
        delta: Math.round(vitals.delta),
        id: vitals.id,
      });
    }

    // In production, you could send to analytics service
    // Examples: Google Analytics, Vercel Analytics, DataDog, etc.
    
    // For now, we'll just acknowledge receipt
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error processing vitals:', error);
    return NextResponse.json(
      { error: 'Failed to process vitals' },
      { status: 500 }
    );
  }
}