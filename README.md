# ConnecTone - 중고 악기 거래 플랫폼

Next.js 15와 Firebase를 사용한 중고 악기 거래 플랫폼입니다.

## 🚀 주요 기능

- **사용자 인증**: Firebase Auth (이메일/비밀번호, SMS 인증)
- **상품 관리**: 악기 등록, 검색, 필터링, 정렬
- **실시간 채팅**: 1:1 채팅 및 공개 Q&A
- **안전결제**: 에스크로 시스템 (플레이스홀더)
- **AI 이미지 분석**: Google Cloud Vision API로 브랜드/모델 자동 인식
- **AI 상태 평가**: Roboflow/YOLOv8로 악기 외관 상태 자동 분석
- **반응형 디자인**: 모바일/데스크톱 최적화

## 🛠 기술 스택

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Storage, Auth)
- **AI**: Google Cloud Vision API, Roboflow/YOLOv8 (준비됨)
- **State Management**: Zustand, React Query
- **Form**: React Hook Form, Zod
- **UI**: Lucide React, Custom Components

## 📦 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd connectone
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=./lib/config/connetone-f7c505e1a75c.json
GOOGLE_CLOUD_PROJECT_ID=connetone
VISION_API_ENDPOINT=https://vision.googleapis.com/v1/images:annotate

# API Configuration
NEXT_PUBLIC_API_BASE_URL=/api

# Development
NODE_ENV=development
```

### 4. Google Cloud 서비스 계정 키 설정

1. Google Cloud Console에서 서비스 계정 키를 다운로드
2. `lib/config/` 폴더에 `connetone-f7c505e1a75c.json` 파일로 저장
3. Vision API가 활성화되어 있는지 확인

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 🔧 Google Cloud Vision API 설정

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Vision API 활성화
4. 서비스 계정 생성 및 키 다운로드

### 2. 서비스 계정 권한

서비스 계정에 다음 권한이 필요합니다:

- Cloud Vision API 사용자
- Firestore 사용자 (선택사항)

### 3. 환경 변수 설정

```env
GOOGLE_APPLICATION_CREDENTIALS=./lib/config/your-service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

## 📁 프로젝트 구조

```
connectone/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── api/               # API 라우트
│   │   ├── transactions/  # 결제 API
│   │   └── vision/        # Vision API
│   ├── chat/              # 채팅 페이지
│   ├── item/              # 상품 상세 페이지
│   ├── list/              # 상품 목록 페이지
│   ├── profile/           # 프로필 페이지
│   └── sell/              # 상품 등록 페이지
├── components/            # 재사용 가능한 컴포넌트
│   └── ui/               # UI 컴포넌트
├── data/                 # 타입 정의 및 상수
├── lib/                  # 유틸리티 및 API 클라이언트
│   ├── api/             # API 함수들
│   ├── auth/            # 인증 관련
│   └── config/          # 설정 파일들
└── styles/              # 글로벌 스타일
```

## 🎯 주요 기능 설명

### AI 이미지 분석

- 이미지 업로드 시 자동으로 브랜드/모델 인식
- Google Cloud Vision API 사용
- 사용자가 제안된 값을 선택/수정 가능

### AI 상태 평가

- 악기 외관 상태 자동 분석 (A~D 등급)
- 결함 감지: 스크래치, 찌그러짐, 균열, 녹 등
- Roboflow/YOLOv8 모델 연동 준비됨 (현재 Mock 데이터)
- 상세한 분석 결과 및 권장사항 제공

### 안전결제 시스템

- 에스크로 방식의 안전한 거래
- 트랜잭션 상태 관리 (pending → paid_hold → shipped → delivered → released)
- 플레이스홀더 구현 (실제 PG 연동 준비됨)

### 실시간 채팅

- Firestore onSnapshot을 사용한 실시간 메시징
- 1:1 채팅 및 공개 Q&A
- 읽음 표시 및 타임스탬프

## 🚀 배포

### Vercel 배포

1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. Google Cloud 서비스 계정 키를 Vercel 환경 변수로 추가

### 환경 변수 (배포용)

```env
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

## 📝 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
# connectone
