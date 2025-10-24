# OAuth 로그인 설정 가이드

## 🚨 중요: 환경 변수 설정 필요

현재 `.env.local` 파일의 OAuth 설정이 올바르지 않습니다. 다음 단계를 따라 설정해주세요:

## 1. Google OAuth 설정

### Google Cloud Console에서 설정:
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. "API 및 서비스" > "사용자 인증 정보" 이동
4. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션"
6. 승인된 자바스크립트 원본:
   - `http://localhost:3000` (개발용)
   - `https://www.connect-tone.com` (프로덕션용)
7. 승인된 리디렉션 URI:
   - `http://localhost:3000/api/auth/callback/google` (개발용)
   - `https://www.connect-tone.com/api/auth/callback/google` (프로덕션용)

### .env.local 파일 수정:
```bash
GOOGLE_CLIENT_ID=실제_구글_클라이언트_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=실제_구글_클라이언트_시크릿
```

## 2. Naver OAuth 설정

### 네이버 개발자 센터에서 설정:
1. [네이버 개발자 센터](https://developers.naver.com/) 접속
2. "내 애플리케이션" > "애플리케이션 등록"
3. 서비스 환경: "웹"
4. 서비스 URL:
   - `http://localhost:3000` (개발용)
   - `https://www.connect-tone.com` (프로덕션용)
5. Callback URL:
   - `http://localhost:3000/api/auth/callback/naver` (개발용)
   - `https://www.connect-tone.com/api/auth/callback/naver` (프로덕션용)

### .env.local 파일 수정:
```bash
NAVER_CLIENT_ID=실제_네이버_클라이언트_ID
NAVER_CLIENT_SECRET=실제_네이버_클라이언트_시크릿
```

## 3. NextAuth 설정

### .env.local 파일 수정:
```bash
NEXTAUTH_URL=https://www.connect-tone.com
NEXTAUTH_SECRET=YdX/v3J89HUE7FT1aSasdgUWoT45n24KcwAlXj3okes=
```

## 4. Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해주세요:

```bash
NEXTAUTH_URL=https://www.connect-tone.com
NEXTAUTH_SECRET=YdX/v3J89HUE7FT1aSasdgUWoT45n24KcwAlXj3okes=
GOOGLE_CLIENT_ID=실제_구글_클라이언트_ID
GOOGLE_CLIENT_SECRET=실제_구글_클라이언트_시크릿
NAVER_CLIENT_ID=실제_네이버_클라이언트_ID
NAVER_CLIENT_SECRET=실제_네이버_클라이언트_시크릿
```

## 5. 테스트 방법

1. 로컬에서 테스트:
   ```bash
   npm run dev
   ```
   - `http://localhost:3000/auth/login` 접속
   - 구글/네이버 로그인 버튼 클릭

2. 프로덕션에서 테스트:
   - `https://www.connect-tone.com/auth/login` 접속
   - 구글/네이버 로그인 버튼 클릭

## 6. 문제 해결

### 일반적인 오류들:
- `redirect_uri_mismatch`: OAuth 설정에서 리디렉션 URI가 정확하지 않음
- `invalid_client`: 클라이언트 ID/시크릿이 잘못됨
- `access_denied`: 사용자가 로그인을 거부함

### 디버깅:
- 브라우저 개발자 도구의 콘솔 확인
- NextAuth 로그 확인 (개발 모드에서 자동 활성화)
- OAuth 제공자 콘솔에서 오류 로그 확인

## 7. 보안 주의사항

- `.env.local` 파일을 Git에 커밋하지 마세요
- 프로덕션에서는 강력한 `NEXTAUTH_SECRET` 사용
- OAuth 클라이언트 시크릿을 안전하게 보관하세요
