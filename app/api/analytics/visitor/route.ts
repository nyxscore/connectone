import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/api/firebase-ultra-safe';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// 관리자 IP 목록 (환경변수에서 가져오거나 하드코딩)
const ADMIN_IPS = [
  '127.0.0.1',
  '::1',
  'localhost',
  // 여기에 관리자 IP 추가
  process.env.ADMIN_IP_1,
  process.env.ADMIN_IP_2,
].filter(Boolean);

// IP를 지역으로 변환하는 함수 (간단한 버전)
async function getLocationFromIP(ip: string): Promise<string> {
  try {
    // 실제로는 IP Geolocation API를 사용해야 하지만, 여기서는 간단한 예시
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return '내부망';
    }
    
    // 간단한 지역 분류 (실제로는 더 정교한 API 필요)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city`);
    if (response.ok) {
      const data = await response.json();
      return data.country === 'South Korea' ? 
        `${data.regionName || '한국'}` : 
        `${data.country || '해외'}`;
    }
  } catch (error) {
    console.log('IP 지역 조회 실패:', error);
  }
  
  return '알 수 없음';
}

export async function POST(request: NextRequest) {
  try {
    const { ip, userAgent, page, userId, isLoggedIn } = await request.json();
    
    // IP 주소 가져오기 (Vercel에서는 x-forwarded-for 헤더 사용)
    const realIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   ip || 'unknown';
    
    // 관리자 IP인지 확인
    const isAdminIP = ADMIN_IPS.some(adminIP => realIp.includes(adminIP));
    if (isAdminIP) {
      return NextResponse.json({ 
        success: true, 
        message: 'Admin IP excluded from analytics',
        isAdmin: true
      });
    }

    const db = await getFirebaseDb();
    
    // 지역 정보 가져오기
    const location = await getLocationFromIP(realIp);
    
    // 방문자 통계 문서 ID (날짜별)
    const today = new Date().toISOString().split('T')[0];
    const visitorDocId = `visitor_${today}`;
    const visitorRef = doc(db, 'analytics', visitorDocId);
    
    // 기존 데이터 가져오기
    const visitorSnap = await getDoc(visitorRef);
    const existingData = visitorSnap.exists() ? visitorSnap.data() : {
      date: today,
      totalVisits: 0,
      uniqueIPs: [],
      loggedInVisits: 0,
      anonymousVisits: 0,
      pageViews: {},
      userAgents: {},
      locations: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // 고유 IP 확인
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
      locations: {
        ...existingData.locations,
        [location]: (existingData.locations[location] || 0) + 1
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
      location: location,
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
    const period = searchParams.get('period') || 'day'; // day, week, month
    
    const db = await getFirebaseDb();
    
    if (period === 'day') {
      // 일별 통계
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
          userAgents: {},
          locations: {}
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
        userAgents: data.userAgents,
        locations: data.locations || {}
      });
    } else {
      // 주별/월별 통계
      const startDate = new Date(date);
      const endDate = new Date(date);
      
      if (period === 'week') {
        endDate.setDate(startDate.getDate() + 7);
      } else if (period === 'month') {
        endDate.setMonth(startDate.getMonth() + 1);
      }
      
      const analyticsRef = collection(db, 'analytics');
      const q = query(
        analyticsRef,
        where('date', '>=', startDate.toISOString().split('T')[0]),
        where('date', '<', endDate.toISOString().split('T')[0])
      );
      
      const snapshot = await getDocs(q);
      let totalVisits = 0;
      let uniqueIPs = new Set();
      let loggedInVisits = 0;
      let anonymousVisits = 0;
      let pageViews = {};
      let userAgents = {};
      let locations = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        totalVisits += data.totalVisits || 0;
        loggedInVisits += data.loggedInVisits || 0;
        anonymousVisits += data.anonymousVisits || 0;
        
        // 고유 IP 집합
        if (data.uniqueIPs) {
          data.uniqueIPs.forEach(ip => uniqueIPs.add(ip));
        }
        
        // 페이지뷰 합계
        Object.entries(data.pageViews || {}).forEach(([page, views]) => {
          pageViews[page] = (pageViews[page] || 0) + views;
        });
        
        // 사용자 에이전트 합계
        Object.entries(data.userAgents || {}).forEach(([ua, count]) => {
          userAgents[ua] = (userAgents[ua] || 0) + count;
        });
        
        // 지역별 합계
        Object.entries(data.locations || {}).forEach(([location, count]) => {
          locations[location] = (locations[location] || 0) + count;
        });
      });
      
      return NextResponse.json({
        date,
        period,
        totalVisits,
        uniqueIPs: uniqueIPs.size,
        loggedInVisits,
        anonymousVisits,
        pageViews,
        userAgents,
        locations
      });
    }

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
