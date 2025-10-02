# SNS 간편 로그인 설정 가이드

ConnecTone에서 구글, 카카오, 네이버 간편 로그인을 설정하는 방법을 안내합니다.

## 1. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수들을 추가하세요:

```env
# SNS 간편 로그인 설정
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

NEXT_PUBLIC_NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 2. 구글 로그인 설정

### 2.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보" 이동
4. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션"
6. 승인된 자바스크립트 원본: `http://localhost:3000` (개발), `https://yourdomain.com` (운영)
7. 승인된 리디렉션 URI: `http://localhost:3000` (개발), `https://yourdomain.com` (운영)
8. 클라이언트 ID와 클라이언트 보안 비밀번호를 복사하여 환경 변수에 설정

### 2.2 Firebase Console 설정

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택 > "Authentication" > "Sign-in method" 이동
3. "Google" 프로바이더 활성화
4. 프로젝트 지원 이메일 설정
5. 웹 클라이언트 ID를 Google Cloud Console에서 생성한 클라이언트 ID로 설정

## 3. 카카오 로그인 설정

### 3.1 Kakao Developers 설정

1. [Kakao Developers](https://developers.kakao.com/)에 접속
2. 애플리케이션 생성
3. "플랫폼" > "Web 플랫폼 등록"
4. 사이트 도메인: `http://localhost:3000` (개발), `https://yourdomain.com` (운영)
5. "제품 설정" > "카카오 로그인" 활성화
6. Redirect URI: `http://localhost:3000` (개발), `https://yourdomain.com` (운영)
7. 동의항목 설정:
   - 닉네임 (선택)
   - 카카오계정(이메일) (선택)
8. 앱 키 > REST API 키를 클라이언트 ID로 사용
9. 보안 > 클라이언트 시크릿을 생성하여 사용

### 3.2 Firebase Console 설정

1. Firebase Console > "Authentication" > "Sign-in method"
2. "카카오" 프로바이더 활성화
3. 클라이언트 ID: Kakao Developers의 REST API 키
4. 클라이언트 보안 비밀번호: Kakao Developers의 클라이언트 시크릿

## 4. 네이버 로그인 설정

### 4.1 Naver Developers 설정

1. [Naver Developers](https://developers.naver.com/)에 접속
2. 애플리케이션 등록
3. 서비스 환경: PC 웹
4. 서비스 URL: `http://localhost:3000` (개발), `https://yourdomain.com` (운영)
5. Callback URL: `http://localhost:3000` (개발), `https://yourdomain.com` (운영)
6. 사용자 정보 조회 API 사용 설정
7. 클라이언트 ID와 클라이언트 시크릿을 복사하여 환경 변수에 설정

### 4.2 Firebase Console 설정

1. Firebase Console > "Authentication" > "Sign-in method"
2. "네이버" 프로바이더 활성화
3. 클라이언트 ID: Naver Developers의 클라이언트 ID
4. 클라이언트 보안 비밀번호: Naver Developers의 클라이언트 시크릿

## 5. 테스트

환경 변수 설정 후 개발 서버를 재시작하고 다음을 확인하세요:

1. 로그인 페이지에서 SNS 로그인 버튼이 표시되는지 확인
2. 각 SNS 로그인 버튼을 클릭했을 때 정상적으로 로그인 팝업이 열리는지 확인
3. 로그인 성공 후 사용자 프로필이 Firestore에 저장되는지 확인

## 6. 운영 환경 배포 시 주의사항

1. 모든 SNS 개발자 콘솔에서 운영 도메인을 추가로 등록
2. Firebase Console에서 운영 도메인을 승인된 도메인으로 추가
3. 환경 변수를 운영 환경에 설정
4. HTTPS 사용 필수 (SNS 로그인은 HTTPS에서만 작동)

## 7. 문제 해결

### 일반적인 오류

1. **"Invalid client" 오류**: 클라이언트 ID가 잘못되었거나 도메인이 등록되지 않음
2. **"Redirect URI mismatch" 오류**: 리디렉션 URI가 등록된 것과 다름
3. **"Access denied" 오류**: 사용자가 로그인을 취소했거나 권한이 부족함

### 디버깅 팁

1. 브라우저 개발자 도구의 콘솔에서 오류 메시지 확인
2. Firebase Console의 Authentication 로그 확인
3. 각 SNS 개발자 콘솔의 로그 확인

## 8. 보안 고려사항

1. 클라이언트 시크릿은 절대 클라이언트 사이드에 노출되지 않도록 주의
2. 환경 변수는 `.env.local` 파일에만 저장하고 `.gitignore`에 포함
3. 운영 환경에서는 강력한 클라이언트 시크릿 사용
4. 정기적으로 API 키 로테이션 고려
