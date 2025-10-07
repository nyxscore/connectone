# 배포 환경 Firebase 인증 오류 해결 가이드

## 문제

배포 환경에서 "인증 중 오류발생" 메시지가 표시되고 로그인이 안 되는 문제

## 원인

Firebase 초기화 방식이 compat API와 모듈화 API가 혼재되어 있었음

## 해결한 내용

✅ Firebase 초기화를 모듈화 API로 통일 (firebase-safe.ts 사용)
✅ 모든 인증 관련 파일 업데이트
✅ SSR-safe한 Firebase 초기화 구현

## 배포 환경에서 추가로 확인/설정해야 할 사항

### 1. Firebase Console 설정

#### A. 승인된 도메인 추가

Firebase Console에서 배포된 도메인을 승인해야 합니다:

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 (connectone-8b414)
3. **Authentication** > **Settings** > **Authorized domains** 이동
4. **Add domain** 클릭
5. 배포 도메인 추가:
   - Vercel 도메인: `your-app.vercel.app`
   - 커스텀 도메인 (있다면): `yourdomain.com`

#### B. OAuth 리다이렉트 URI 설정 (SNS 로그인용)

##### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. API 및 서비스 > 사용자 인증 정보
3. OAuth 2.0 클라이언트 ID 선택
4. **승인된 리디렉션 URI** 추가:
   - `https://connectone-8b414.firebaseapp.com/__/auth/handler`
   - `https://your-app.vercel.app/__/auth/handler`

##### Kakao OAuth (사용 시)

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 내 애플리케이션 > 앱 선택
3. 제품 설정 > 카카오 로그인
4. **Redirect URI** 추가:
   - `https://connectone-8b414.firebaseapp.com/__/auth/handler`
   - `https://your-app.vercel.app/__/auth/handler`

##### Naver OAuth (사용 시)

1. [Naver Developers](https://developers.naver.com/) 접속
2. Application > 내 애플리케이션
3. API 설정
4. **Callback URL** 추가:
   - `https://connectone-8b414.firebaseapp.com/__/auth/handler`
   - `https://your-app.vercel.app/__/auth/handler`

### 2. Vercel 환경 변수 설정

Vercel Dashboard에서 환경 변수를 설정해야 합니다:

1. Vercel Dashboard > 프로젝트 선택 > Settings > Environment Variables
2. 다음 환경 변수들을 추가:

```bash
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDy-EXIHVfzBhKcsNq93BfmQ2SQCWRszOs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=connectone-8b414.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=connectone-8b414
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=connectone-8b414.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=567550026947
NEXT_PUBLIC_FIREBASE_APP_ID=1:567550026947:web:92120b0c926db2ece06e76
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-P7KKSEF6SZ
```

**중요**: `NEXT_PUBLIC_` 접두사가 있어야 클라이언트에서 사용 가능합니다.

### 3. 재배포

환경 변수를 설정한 후 재배포가 필요합니다:

```bash
# Git push로 자동 배포
git add .
git commit -m "Fix: Firebase authentication with modular API"
git push origin main

# 또는 Vercel CLI로 수동 배포
vercel --prod
```

### 4. 테스트

배포 후 다음을 테스트하세요:

1. **일반 로그인/회원가입**: username/password 로그인 테스트
2. **구글 로그인**: 팝업 차단 해제 후 테스트
3. **카카오/네이버 로그인**: OAuth 설정 완료 후 테스트

### 5. 디버깅

문제가 계속되면 브라우저 콘솔에서 오류 확인:

```javascript
// 브라우저 콘솔에서 실행
console.log("Firebase Config:", {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
```

### 6. 일반적인 오류와 해결책

#### "auth/unauthorized-domain"

- Firebase Console에서 도메인 승인 필요

#### "auth/popup-blocked"

- 브라우저 팝업 차단 해제 또는 리다이렉트 로그인 사용

#### "auth/invalid-api-key"

- Vercel 환경 변수 확인

#### "auth/network-request-failed"

- Firebase 프로젝트가 활성화되어 있는지 확인
- API 키가 올바른지 확인

## 변경된 파일 목록

- ✅ lib/auth.ts
- ✅ lib/auth/actions.ts
- ✅ lib/auth/snsAuth.ts
- ✅ lib/api/firebase-safe.ts
- ✅ lib/hooks/useAuth.ts
- ✅ lib/chat/api.ts
- ✅ lib/api/product-detail.ts
- ✅ lib/profile/api.ts
- ✅ lib/profile/responseRate.ts
- ✅ components/chat/\* (모든 채팅 컴포넌트)
- ✅ components/product/\* (상품 관련 컴포넌트)
- ✅ app/payment/\*.tsx
- ✅ app/profile/transactions/page.tsx

## 다음 단계

1. Firebase Console에서 도메인 승인
2. Vercel 환경 변수 설정
3. 재배포
4. 테스트

## 참고

- Firebase 공식 문서: https://firebase.google.com/docs/auth/web/start
- Next.js 환경 변수: https://nextjs.org/docs/basic-features/environment-variables
- Vercel 환경 변수: https://vercel.com/docs/concepts/projects/environment-variables
