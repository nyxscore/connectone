# 🚀 배포 환경 설정 가이드

## Vercel 환경변수 설정

다음 환경변수들을 Vercel 대시보드에서 설정해야 합니다:

### Firebase 환경변수
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDy-EXIHVfzBhKcsNq93BfmQ2SQCWRszOs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=connectone-8b414.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=connectone-8b414
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=connectone-8b414.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=567550026947
NEXT_PUBLIC_FIREBASE_APP_ID=1:567550026947:web:92120b0c926db2ece06e76
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-P7KKSEF6SZ
```

### 앱 환경변수
```
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://connectone-nyxscore-9862s-projects.vercel.app
```

## Vercel 대시보드 설정 방법

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 위의 환경변수들을 모두 추가
4. Production, Preview, Development 환경 모두에 적용
5. Redeploy 실행

## Firebase 도메인 승인

Firebase Console에서 다음 도메인들을 승인해야 합니다:
- `connectone-nyxscore-9862s-projects.vercel.app`
- `connectone-nyxscore-9862-nyxscore-9862s-projects.vercel.app`

## 배포 후 확인사항

1. 브라우저 콘솔에서 "🔥 Firebase 환경변수 확인" 로그 확인
2. 모든 환경변수가 "✅ 설정됨"으로 표시되는지 확인
3. Firebase 오류가 없는지 확인

## 문제 해결

### 환경변수가 "❌ 누락"으로 표시되는 경우
- Vercel 대시보드에서 환경변수 재확인
- 환경변수 이름이 정확한지 확인 (NEXT_PUBLIC_ 접두사 필수)
- Redeploy 실행

### Firebase 초기화 오류가 발생하는 경우
- Firebase Console에서 도메인 승인 확인
- Firebase 프로젝트 설정 확인
- 브라우저 콘솔의 상세 오류 로그 확인
