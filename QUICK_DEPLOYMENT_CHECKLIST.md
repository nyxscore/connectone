# 🚀 배포 전 체크리스트

## ✅ 완료된 사항

- [x] Firebase 초기화를 모듈화 API로 통일
- [x] 모든 인증 관련 파일 업데이트 완료
- [x] SSR-safe Firebase 초기화 구현
- [x] 프로덕션 빌드 테스트 완료
- [x] 오래된 firebase.ts 백업으로 이동

## 🔧 배포 환경에서 바로 해야 할 일

### 1. Firebase Console - 승인된 도메인 추가 (가장 중요!)

**이것이 "인증 중 오류발생" 문제의 주요 원인입니다!**

1. https://console.firebase.google.com/ 접속
2. 프로젝트 선택: **connectone-8b414**
3. **Authentication** 메뉴 클릭
4. **Settings** 탭 > **Authorized domains** 클릭
5. **Add domain** 버튼 클릭
6. 배포된 도메인 추가:
   - Vercel 도메인 (예: `connectone.vercel.app`)
   - 커스텀 도메인 (있다면)

### 2. Vercel 환경 변수 확인

https://vercel.com 대시보드에서:

1. 프로젝트 선택
2. Settings > Environment Variables
3. 다음 변수들이 **Production** 환경에 설정되어 있는지 확인:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDy-EXIHVfzBhKcsNq93BfmQ2SQCWRszOs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=connectone-8b414.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=connectone-8b414
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=connectone-8b414.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=567550026947
NEXT_PUBLIC_FIREBASE_APP_ID=1:567550026947:web:92120b0c926db2ece06e76
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-P7KKSEF6SZ
```

### 3. Git Push & 재배포

```bash
# 변경사항 커밋
git add .
git commit -m "Fix: Firebase authentication - use modular API"
git push origin main
```

Vercel이 자동으로 재배포를 시작합니다.

### 4. 배포 후 테스트

배포가 완료되면 다음을 테스트하세요:

1. **일반 로그인** 테스트
   - 회원가입
   - 로그인
   - 로그아웃

2. **SNS 로그인** 테스트 (설정 완료 시)
   - 구글 로그인
   - 카카오 로그인
   - 네이버 로그인

## 🐛 문제 발생 시 디버깅

### 브라우저 콘솔 확인

배포된 사이트에서 F12를 눌러 콘솔을 열고:

1. 로그인 시도
2. 콘솔에 나타나는 오류 메시지 확인
3. 특히 다음 오류들을 찾아보세요:
   - `auth/unauthorized-domain` → Firebase Console에서 도메인 승인 필요
   - `auth/invalid-api-key` → Vercel 환경 변수 확인
   - `auth/network-request-failed` → Firebase 프로젝트 활성화 확인

### Firebase 초기화 확인

콘솔에서 실행:

```javascript
console.log("Firebase initialized:", window.firebase ? "YES" : "NO");
```

### 일반적인 오류와 해결책

| 오류                       | 원인                                | 해결책                                |
| -------------------------- | ----------------------------------- | ------------------------------------- |
| `auth/unauthorized-domain` | 도메인이 Firebase에서 승인되지 않음 | Firebase Console에서 도메인 추가      |
| `auth/invalid-api-key`     | API 키가 잘못됨                     | Vercel 환경 변수 확인                 |
| `auth/popup-blocked`       | 브라우저가 팝업을 차단함            | 팝업 허용 또는 리다이렉트 로그인 사용 |
| `Firebase not initialized` | 서버 사이드에서 Firebase 호출       | 클라이언트에서만 호출하도록 수정      |

## 📝 SNS 로그인 추가 설정 (선택사항)

SNS 로그인을 사용하려면 추가 설정이 필요합니다:

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/)
2. OAuth 2.0 클라이언트 ID 설정
3. 승인된 리디렉션 URI 추가:
   - `https://connectone-8b414.firebaseapp.com/__/auth/handler`
   - `https://[your-domain]/__/auth/handler`

### Kakao OAuth

1. [Kakao Developers](https://developers.kakao.com/)
2. Redirect URI 추가
3. Vercel 환경 변수에 `NEXT_PUBLIC_KAKAO_CLIENT_ID` 추가

### Naver OAuth

1. [Naver Developers](https://developers.naver.com/)
2. Callback URL 추가
3. Vercel 환경 변수에 `NEXT_PUBLIC_NAVER_CLIENT_ID` 추가

## 🎉 완료!

위 단계를 모두 완료하면 배포 환경에서 로그인이 정상적으로 작동합니다!

## 📞 추가 지원이 필요하면

- Firebase Console: https://console.firebase.google.com/
- Vercel Dashboard: https://vercel.com/
- Firebase Auth 문서: https://firebase.google.com/docs/auth/web/start
