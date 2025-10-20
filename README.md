# 🎵 ConnecTone - 중고 악기 거래 플랫폼

안전하고 신뢰할 수 있는 중고 악기 거래 플랫폼입니다. 피아노, 기타, 드럼, 바이올린 등 다양한 악기를 거래할 수 있습니다.

## ✨ 주요 기능

### 🎯 핵심 기능

- **사용자 인증**: 이메일/SMS 인증, 등급 시스템 (C~B)
- **상품 등록**: AI 이미지 분석, 상태 평가, 카테고리 분류
- **검색/필터**: 키워드, 카테고리, 지역, 가격 범위 필터
- **실시간 채팅**: 1:1 채팅, 공개 Q&A
- **안전결제**: PG사 연동, 에스크로 시스템
- **운송 서비스**: 대형 악기 운송 견적/주문

### 🤖 AI 기능

- **Google Vision API**: 브랜드/모델 자동 인식
- **Roboflow/YOLOv8**: 악기 상태 평가 (스크래치, 덴트 등)
- **자동 태깅**: 감정 분석, 보증 라벨

### 📧 알림 시스템

- **이메일 알림**: 거래/채팅/질문/결제 상태
- **템플릿 3종**: 신규메시지, 거래진행, 운송견적
- **PWA 준비**: 웹푸시, FCM 푸시 (향후)

### 🛡️ 관리자 기능

- **신고 관리**: 사용자/상품/메시지 신고 처리
- **분쟁 처리**: 거래 분쟁 조사/해결
- **사용자 관리**: 정지/해제, 등급 관리
- **매물 관리**: 숨김/노출, 라벨 부여

## 🚀 기술 스택

### Frontend

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** (스타일링)
- **Zustand** (상태 관리)
- **React Query** (서버 상태 관리)
- **React Hook Form + Zod** (폼 관리)

### Backend

- **Firebase** (Authentication, Firestore, Storage)
- **Next.js API Routes** (서버리스 API)
- **Google Cloud Vision API** (이미지 분석)

## 🔧 환경 설정

### Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication에서 이메일/비밀번호 인증 활성화
3. Firestore Database 생성
4. Storage 버킷 생성
5. 프로젝트 설정 > 일반 > 웹 앱에서 설정 정보 복사

### 환경변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (서버 사이드용)
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
```

### AI/ML

- **Google Vision API** (브랜드/모델 인식)
- **Roboflow/YOLOv8** (상태 평가, 준비됨)

### 배포/인프라

- **Firebase Hosting** (호스팅)
- **Cloudinary** (이미지 CDN)
- **Sentry** (오류 로깅)
- **GA4/PostHog** (분석)

## 📦 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/connetone.git
cd connetone
```

### 2. 의존성 설치

```bash
npm install
# 또는
yarn install
```

### 3. 환경변수 설정

```bash
# 환경변수 파일 복사
cp env.example .env.local

# .env.local 파일 편집
# Firebase, Google Cloud, 기타 API 키 설정
```

### 4. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 🔧 환경변수 설정

### 필수 환경변수

```env
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=./lib/config/firebase-service-account.json
GOOGLE_CLOUD_PROJECT_ID=your_project_id

# 이메일 서비스
EMAIL_API_KEY=SG.your_sendgrid_api_key
FROM_EMAIL=noreply@connetone.com
```

### 선택적 환경변수

```env
# 분석 및 모니터링
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key

# CDN 및 이미지 최적화
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
```

자세한 환경변수 설정은 [env.example](env.example) 파일을 참고하세요.

## 🏗️ 프로젝트 구조

```
connetone/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # 인증 페이지
│   ├── admin/             # 관리자 페이지
│   ├── profile/           # 프로필 페이지
│   ├── item/              # 상품 상세 페이지
│   └── globals.css        # 전역 스타일
├── components/            # React 컴포넌트
│   ├── ui/                # UI 컴포넌트
│   ├── SEO/               # SEO 컴포넌트
│   └── Image/             # 이미지 최적화
├── lib/                   # 유틸리티 및 설정
│   ├── auth/              # 인증 로직
│   ├── email/             # 이메일 서비스
│   ├── notifications/     # 알림 시스템
│   ├── analytics/         # 분석 도구
│   └── monitoring/        # 모니터링
├── data/                  # 타입 정의 및 상수
├── public/                # 정적 파일
│   ├── icons/             # PWA 아이콘
│   ├── images/            # 이미지 파일
│   ├── manifest.json      # PWA 매니페스트
│   └── sw.js             # Service Worker
└── firebase.json         # Firebase 배포 설정
```

## 🚀 배포

### Firebase 배포

1. **Firebase CLI 설치**

```bash
npm i -g firebase-tools
```

2. **로그인 및 배포**

```bash
firebase login
firebase deploy
```

3. **환경변수 설정**
   Firebase 콘솔에서 프로덕션 환경변수를 설정하세요.

### 환경별 배포

#### 개발 환경

```bash
npm run dev
# http://localhost:3000
```

#### 스테이징 환경

```bash
npm run build
npm run start
# 또는 Firebase Hosting
```

#### 프로덕션 환경

```bash
firebase deploy --only hosting
# https://connetone.web.app
```

## 🔍 개발 가이드

### 코드 스타일

- **ESLint + Prettier** 사용
- **TypeScript** 엄격 모드
- **Tailwind CSS** 클래스명 컨벤션

### 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드/설정 변경
```

### 브랜치 전략

- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

## 📊 모니터링 및 분석

### 오류 로깅

- **Sentry**: 실시간 오류 추적
- **Firebase Performance**: 성능 모니터링

### 사용자 분석

- **Google Analytics 4**: 페이지뷰, 이벤트 추적
- **PostHog**: 사용자 행동 분석

### 성능 최적화

- **Next.js Image Optimization**: 자동 이미지 최적화
- **Cloudinary CDN**: 이미지 CDN 캐싱
- **PWA**: 오프라인 지원, 웹푸시

## 🔒 보안

### 인증 및 권한

- **Firebase Auth**: 이메일/SMS 인증
- **JWT 토큰**: API 인증
- **등급 시스템**: 사용자 권한 관리

### 데이터 보호

- **Firestore Security Rules**: 데이터베이스 보안
- **환경변수**: 민감한 정보 보호
- **HTTPS**: 모든 통신 암호화

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 📞 지원

- **이메일**: support@connetone.com
- **문서**: [docs.connetone.com](https://docs.connetone.com)
- **이슈**: [GitHub Issues](https://github.com/your-username/connetone/issues)

## 🗺️ 로드맵

### Phase 1 (현재)

- [x] 기본 플랫폼 구축
- [x] 사용자 인증 및 등급 시스템
- [x] 상품 등록 및 검색
- [x] 실시간 채팅
- [x] 안전결제 시스템
- [x] AI 이미지 분석

### Phase 2 (예정)

- [ ] PWA 웹푸시 알림
- [ ] 모바일 앱 (React Native)
- [ ] 고급 AI 기능
- [ ] 실시간 알림

### Phase 3 (장기)

- [ ] 다국어 지원
- [ ] 국제 거래
- [ ] NFT 연동
- [ ] VR/AR 체험

---

**ConnecTone**으로 음악의 새로운 연결을 만들어보세요! 🎵✨
강제 재배포를 위한 더미 수정
