import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/api/firebase-ultra-safe';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { ip, userAgent, page, userId, isLoggedIn } = await request.json();
    
    // IP 주소 가져오기 (Vercel에서는 x-forwarded-for 헤더 사용)
    const realIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   ip || 'unknown';

    const db = await getFirebaseDb();
    
    // 방문자 통계 문서 ID (날짜별)
    const today = new Date().toISOString().split('T')[0];
    const visitorDocId = `visitor_${today}`;
    const visitorRef = doc(db, 'analytics', visitorDocId);
    
    // 기존 데이터 가져오기
    const visitorSnap = await getDoc(visitorRef);
    const existingData = visitorSnap.exists() ? visitorSnap.data() : {
      date: today,
      totalVisits: 0,
      uniqueIPs: new Set(),
      loggedInVisits: 0,
      anonymousVisits: 0,
      pageViews: {},
      userAgents: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Set을 배열로 변환 (Firestore는 Set을 지원하지 않음)
    const uniqueIPs = existingData.uniqueIPs || [];
    const isNewIP = !uniqueIPs.includes(realIp);

    // 통계 업데이트
    const updatedData = {
      ...existingData,
      totalVisits: existingData.totalVisits + 1,
      uniqueIPs: isNewIP ? [...uniqueIPs, realIp] : uniqueIPs,
      loggedInVisits: isLoggedIn ? existingData.loggedInVisits + 1 : existingData.loggedInVisits,
      anonymousVisits: !isLoggedIn ? existingData.anonymousVisits + 1 : existingData.anonymousVisits,
      pageViews: {
        ...existingData.pageViews,
        [page]: (existingData.pageViews[page] || 0) + 1
      },
      userAgents: {
        ...existingData.userAgents,
        [userAgent]: (existingData.userAgents[userAgent] || 0) + 1
      },
      updatedAt: serverTimestamp()
    };

    // Firestore에 저장
    await setDoc(visitorRef, updatedData);

    // 개별 방문 기록도 저장 (선택사항)
    const visitId = `${realIp}_${Date.now()}`;
    const visitRef = doc(db, 'visits', visitId);
    await setDoc(visitRef, {
      ip: realIp,
      userAgent,
      page,
      userId: userId || null,
      isLoggedIn: isLoggedIn || false,
      timestamp: serverTimestamp(),
      date: today
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Visitor data recorded',
      isNewIP,
      totalUniqueIPs: updatedData.uniqueIPs.length
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record visitor data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const db = await getFirebaseDb();
    const visitorDocId = `visitor_${date}`;
    const visitorRef = doc(db, 'analytics', visitorDocId);
    const visitorSnap = await getDoc(visitorRef);
    
    if (!visitorSnap.exists()) {
      return NextResponse.json({
        date,
        totalVisits: 0,
        uniqueIPs: 0,
        loggedInVisits: 0,
        anonymousVisits: 0,
        pageViews: {},
        userAgents: {}
      });
    }
    
    const data = visitorSnap.data();
    return NextResponse.json({
      date: data.date,
      totalVisits: data.totalVisits,
      uniqueIPs: data.uniqueIPs?.length || 0,
      loggedInVisits: data.loggedInVisits,
      anonymousVisits: data.anonymousVisits,
      pageViews: data.pageViews,
      userAgents: data.userAgents
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
