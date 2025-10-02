# SNS API 연동 설정 가이드

## 1. 카카오 로그인 설정

### 1.1 카카오 개발자 콘솔 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 애플리케이션 생성 또는 기존 앱 선택
3. **앱 설정 > 플랫폼**에서 Web 플랫폼 추가
4. **사이트 도메인** 등록:
   - 개발: `http://localhost:3000`
   - 운영: `https://yourdomain.com`

### 1.2 카카오 로그인 설정

1. **제품 설정 > 카카오 로그인** 활성화
2. **Redirect URI** 설정:
   - 개발: `http://localhost:3000/auth/kakao/callback`
   - 운영: `https://yourdomain.com/auth/kakao/callback`
3. **동의항목** 설정:
   - 필수: 프로필 정보(닉네임), 카카오계정(이메일)
   - 선택: 프로필 사진

### 1.3 환경 변수 설정

```bash
# .env.local 파일에 추가
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
```

---

## 2. 네이버 로그인 설정

### 2.1 네이버 개발자 센터 설정

1. [네이버 개발자 센터](https://developers.naver.com/) 접속
2. 애플리케이션 등록
3. **서비스 환경** 설정:
   - 개발: `http://localhost:3000`
   - 운영: `https://yourdomain.com`

### 2.2 네이버 로그인 설정

1. **API 설정 > 네이버 로그인** 활성화
2. **Callback URL** 설정:
   - 개발: `http://localhost:3000/auth/naver/callback`
   - 운영: `https://yourdomain.com/auth/naver/callback`
3. **서비스명** 입력: ConnecTone

### 2.3 환경 변수 설정

```bash
# .env.local 파일에 추가
NEXT_PUBLIC_NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

---

## 3. 구글 로그인 설정

### 3.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **API 및 서비스 > 사용 설정된 API**에서 Google+ API 활성화

### 3.2 OAuth 2.0 클라이언트 ID 생성

1. **API 및 서비스 > 사용자 인증 정보** 이동
2. **OAuth 2.0 클라이언트 ID** 생성
3. **애플리케이션 유형**: 웹 애플리케이션
4. **승인된 자바스크립트 원본**:
   - 개발: `http://localhost:3000`
   - 운영: `https://yourdomain.com`
5. **승인된 리디렉션 URI**:
   - 개발: `http://localhost:3000/auth/google/callback`
   - 운영: `https://yourdomain.com/auth/google/callback`

### 3.3 환경 변수 설정

```bash
# .env.local 파일에 추가
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 4. Firebase Authentication 설정

### 4.1 Firebase Console 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. **Authentication > Sign-in method** 이동
4. 각 제공업체 활성화:
   - **Google**: 위에서 생성한 OAuth 2.0 클라이언트 ID 사용
   - **카카오**: 카카오 개발자 콘솔에서 발급받은 키 사용
   - **네이버**: 네이버 개발자 센터에서 발급받은 키 사용

### 4.2 Firebase 설정 파일 업데이트

`lib/api/firebase.ts`에서 각 제공업체 설정 확인:

```typescript
// 카카오 제공업체
const kakaoProvider = new OAuthProvider("oidc.kakao");
kakaoProvider.addScope("profile");
kakaoProvider.addScope("account_email");

// 네이버 제공업체
const naverProvider = new OAuthProvider("oidc.naver");
naverProvider.addScope("profile");
naverProvider.addScope("email");

// 구글 제공업체
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");
```

---

## 5. 콜백 페이지 생성

각 SNS 로그인 후 리다이렉트될 콜백 페이지를 생성해야 합니다.

### 5.1 카카오 콜백 페이지

`app/auth/kakao/callback/page.tsx` 생성

### 5.2 네이버 콜백 페이지

`app/auth/naver/callback/page.tsx` 생성

### 5.3 구글 콜백 페이지

`app/auth/google/callback/page.tsx` 생성

---

## 6. 테스트 방법

### 6.1 개발 환경 테스트

1. `.env.local` 파일에 모든 API 키 설정
2. 개발 서버 실행: `npm run dev`
3. 각 SNS 로그인 버튼 클릭하여 테스트

### 6.2 운영 환경 배포

1. 각 SNS 개발자 콘솔에서 운영 도메인 등록
2. 환경 변수를 배포 플랫폼에 설정
3. Firebase Authentication에서 운영 도메인 허용

---

## 7. 주의사항

### 7.1 보안

- 클라이언트 시크릿은 절대 클라이언트에 노출되지 않도록 주의
- 환경 변수는 `.gitignore`에 포함되어 있는지 확인

### 7.2 도메인 설정

- 개발/운영 환경별로 올바른 도메인 설정
- HTTPS 사용 권장 (운영 환경)

### 7.3 사용자 동의

- 각 SNS별로 필요한 동의항목만 요청
- 개인정보처리방침과 연동

---

## 8. 문제 해결

### 8.1 일반적인 오류

- **Invalid redirect URI**: 콜백 URL이 정확한지 확인
- **Invalid client**: 클라이언트 ID가 올바른지 확인
- **Access denied**: 사용자가 로그인을 거부했는지 확인

### 8.2 디버깅

- 브라우저 개발자 도구에서 네트워크 탭 확인
- Firebase Console에서 Authentication 로그 확인
- 각 SNS 개발자 콘솔에서 로그 확인

---

## 9. 추가 기능

### 9.1 사용자 프로필 연동

- SNS에서 받은 프로필 정보를 Firestore에 저장
- 프로필 사진 자동 설정
- 닉네임 중복 처리

### 9.2 로그아웃 처리

- 각 SNS별 로그아웃 API 호출
- Firebase에서 로그아웃 처리

### 9.3 계정 연동

- 기존 계정과 SNS 계정 연동
- 여러 SNS 계정 연결 지원
