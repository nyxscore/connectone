# 🎵 AI 보컬 분석 기능 가이드

ConnecTone에 추가된 AI 보컬 분석 기능 사용 가이드입니다.

---

## 📋 목차

1. [기능 소개](#기능-소개)
2. [설정 방법](#설정-방법)
3. [Replicate API 토큰 발급](#replicate-api-토큰-발급)
4. [사용 방법](#사용-방법)
5. [비용 안내](#비용-안내)
6. [기술 스택](#기술-스택)
7. [문제 해결](#문제-해결)

---

## 🎯 기능 소개

AI 보컬 분석 기능은 사용자가 업로드한 음성 파일을 AI가 자동으로 분석하여 다음 정보를 제공합니다:

### 제공 정보:

- **📝 트랜스크립션**: 음성을 텍스트로 변환 (Whisper AI)
- **😊 감정 분석**: 음성의 감정 상태 분석 (행복, 슬픔, 화남 등)
- **🎵 피치 분석**: 평균 피치(Hz), 피치 안정성
- **🎶 템포 분석**: BPM(Beats Per Minute)
- **🎹 조성 분석**: 음악의 조성(Key) 및 모드(Major/Minor)

### 지원 형식:

- WAV, MP3, OGG, WEBM
- 최대 파일 크기: 30MB

---

## ⚙️ 설정 방법

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Replicate API Token (필수)
REPLICATE_API_TOKEN=r8_QTDNQjY1Tt8KOCSYS90yCA8VBYroAF13yRclq
```

### 2. 패키지 설치

이미 설치되어 있어야 하지만, 확인차 다시 실행:

```bash
npm install replicate
```

---

## 🔑 Replicate API 토큰 발급

### Step 1: Replicate 계정 생성

1. [Replicate 웹사이트](https://replicate.com/) 접속
2. "Sign Up" 클릭하여 계정 생성 (GitHub 로그인 가능)

### Step 2: API 토큰 발급

1. 로그인 후 우측 상단 프로필 클릭
2. "Settings" → "API tokens" 메뉴 이동
3. "Create token" 버튼 클릭
4. 생성된 토큰 복사 (형식: `r8_...`)

### Step 3: 환경 변수에 추가

```bash
# .env.local 파일에 추가
REPLICATE_API_TOKEN=r8_여기에_복사한_토큰_붙여넣기
```

⚠️ **중요**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

---

## 📱 사용 방법

### 웹 브라우저에서:

1. **로그인** → ConnecTone 계정으로 로그인
2. **메뉴 접근** → 헤더의 "AI 보컬 분석" 클릭
3. **파일 업로드**
   - 드래그 앤 드롭
   - 파일 선택 버튼 클릭
   - 또는 직접 녹음
4. **분석 시작** → "AI 분석 시작" 버튼 클릭
5. **결과 확인** → 약 30초~2분 후 결과 표시

### 결과 활용:

- **트랜스크립션 복사**: "복사" 버튼 클릭
- **SRT 파일 다운로드**: 자막 파일로 저장
- **오디오 재생**: 플레이 버튼으로 파일 재생

---

## 💰 이용 요금

### ConnecTone AI 보컬 분석 요금:

**<span style="text-decoration: line-through; color: gray;">2,900원</span> → 0원 무료!** 🎉

- ✅ **완전 무료** - 횟수 제한 없음
- ✅ **회원 전용** - 로그인 후 이용 가능
- ✅ **고품질 AI 분석** - Whisper 기반 정확한 분석

---

## 🛠️ 기술 스택

### AI 모델:

1. **OpenAI Whisper**
   - 모델: `openai/whisper:large-v3`
   - 용도: 음성 → 텍스트 변환
   - 정확도: ~90-95%

2. **Emotion Detection**
   - 모델: 커스텀 감정 분석 모델
   - 용도: 감정 상태 분류
   - 지원 감정: Happy, Sad, Angry, Neutral, Excited

3. **Pitch/Tempo/Key Analysis**
   - Fallback 알고리즘 사용
   - 향후 전문 음악 분석 모델로 업그레이드 예정

### 프론트엔드:

- React + Next.js 14
- Tailwind CSS
- Framer Motion (애니메이션)
- Chart.js / Recharts (시각화)

### 백엔드:

- Next.js API Routes
- Replicate API
- Firebase Storage (오디오 저장)

---

## 🔧 문제 해결

### 1. "API 인증 실패" 오류

**원인**: Replicate API 토큰이 설정되지 않았거나 잘못됨

**해결방법**:

```bash
# .env.local 파일 확인
REPLICATE_API_TOKEN=r8_...  # 올바른 토큰인지 확인
```

### 2. "지원되지 않는 파일 형식" 오류

**원인**: WAV, MP3, OGG, WEBM 외의 형식

**해결방법**:

- 온라인 변환기로 지원 형식으로 변환
- 추천 도구: [CloudConvert](https://cloudconvert.com/)

### 3. "파일 크기 초과" 오류

**원인**: 30MB 초과 파일

**해결방법**:

- 오디오 압축 (비트레이트 낮추기)
- 파일 분할 (긴 파일을 여러 개로 나누기)

### 4. "API 요청 한도 초과" 오류

**원인**: Replicate API rate limit 초과

**해결방법**:

- 잠시 대기 후 재시도
- Replicate 대시보드에서 한도 확인
- 유료 플랜 고려

### 5. 분석 결과가 부정확함

**원인**:

- 배경 소음이 많은 오디오
- 음질이 낮은 파일
- 여러 사람이 동시에 말하는 경우

**해결방법**:

- 깨끗한 오디오 녹음 권장
- 노이즈 제거 도구 사용
- 한 사람씩 분리하여 녹음

---

## 🚀 고급 설정

### 로컬 테스트용 Mock 모드:

개발 중 API 비용을 절약하려면 Mock 데이터를 사용할 수 있습니다:

```typescript
// app/api/audio/analyze/route.ts
const USE_MOCK =
  process.env.NODE_ENV === "development" && !process.env.REPLICATE_API_TOKEN;
```

### Firebase Storage 연동 (선택사항):

분석한 오디오 파일을 저장하려면:

```typescript
// lib/api/audio-storage.ts 생성
import { getStorage, ref, uploadBytes } from "firebase/storage";

export async function uploadAudioToFirebase(file: File, userId: string) {
  const storage = getStorage();
  const audioRef = ref(
    storage,
    `audio-analyses/${userId}/${Date.now()}_${file.name}`
  );
  await uploadBytes(audioRef, file);
  return audioRef.fullPath;
}
```

---

## 📚 추가 리소스

- [Replicate 문서](https://replicate.com/docs)
- [Whisper 모델 정보](https://replicate.com/openai/whisper)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Firebase Storage](https://firebase.google.com/docs/storage)

---

## 🤝 지원

문제가 있거나 기능 요청이 있으면:

1. **GitHub Issues** → [프로젝트 이슈 페이지]
2. **이메일** → support@connectone.com
3. **Discord** → [커뮤니티 채널]

---

## 📝 변경 이력

### v1.0.0 (2025-01-15)

- ✅ AI 보컬 분석 기능 추가
- ✅ Whisper 기반 트랜스크립션
- ✅ 감정 분석
- ✅ 피치/템포/조성 분석
- ✅ SRT 파일 다운로드
- ✅ 오디오 녹음 기능

---

**Made with ❤️ by ConnecTone Team**
