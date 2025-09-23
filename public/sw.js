// ConnecTone PWA Service Worker
const CACHE_NAME = 'connetone-v1';
const urlsToCache = [
  '/',
  '/list',
  '/sell',
  '/chat',
  '/profile',
  '/auth/login',
  '/auth/signup',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시 열기');
        return cache.addAll(urlsToCache);
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화 중...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// fetch 이벤트
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시된 버전 반환
        if (response) {
          return response;
        }
        
        // 네트워크 요청
        return fetch(event.request).then((response) => {
          // 유효한 응답인지 확인
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 응답 복사
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// 푸시 알림 이벤트 (PWA 도입 후 활성화)
self.addEventListener('push', (event) => {
  console.log('푸시 알림 수신:', event);
  
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ConnecTone', options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  console.log('알림 클릭:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    // 앱 열기
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // 알림만 닫기
    return;
  } else {
    // 기본 동작: 앱 열기
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 백그라운드 동기화 (향후 구현)
self.addEventListener('sync', (event) => {
  console.log('백그라운드 동기화:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 오프라인 상태에서 저장된 데이터 동기화
      syncOfflineData()
    );
  }
});

// 오프라인 데이터 동기화 함수
async function syncOfflineData() {
  try {
    // IndexedDB에서 오프라인 데이터 조회
    // 네트워크가 복구되면 서버에 전송
    console.log('오프라인 데이터 동기화 중...');
  } catch (error) {
    console.error('동기화 오류:', error);
  }
}

// 메시지 이벤트 (메인 스레드와 통신)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});





