# 🚀 ConnecTone 배포 가이드

## 배포 구조 이해하기

ConnecTone은 **2가지 서비스**를 사용합니다:

```
┌─────────────────────────┐
│   Vercel (코드 배포)     │  ← Next.js 앱
│   - 자동 배포            │  ← Git push만 하면 OK
└─────────────────────────┘

┌─────────────────────────┐
│ Firebase (보안 규칙)     │  ← Firestore 규칙
│   - 수동 배포 필요       │  ← 규칙 변경 시에만
└─────────────────────────┘
```

---

## ✅ 일반적인 배포 (코드 변경)

### 대부분의 경우 이것만 하면 됩니다!

```bash
npm run deploy:vercel
```

또는

```bash
git add .
git commit -m "변경 내용"
git push origin main
```

**→ Vercel이 자동으로 배포합니다! 끝!** 🎉

---

## 🔒 Firestore 규칙 변경 시에만

Firestore 보안 규칙(`firestore.rules`)을 수정했을 때만:

```bash
npm run deploy:firebase
```

**언제 필요한가?**

- `firestore.rules` 파일 수정 시
- 새로운 컬렉션 추가 시
- 권한 정책 변경 시

**대부분은 필요 없습니다!** (규칙은 자주 안 바뀜)

---

## 🚀 완전 배포 (둘 다)

코드 + Firebase 규칙을 한 번에 배포:

```bash
npm run deploy
```

이 명령어는:

1. Git push (Vercel 자동 배포 트리거)
2. Firebase 규칙 배포

---

## 📋 배포 명령어 요약

| 명령어                    | 용도                 | 실행 빈도    |
| ------------------------- | -------------------- | ------------ |
| `npm run deploy:vercel`   | 코드만 배포 (Vercel) | ⭐ 매번      |
| `npm run deploy:firebase` | Firebase 규칙만 배포 | 가끔         |
| `npm run deploy`          | 전체 배포 (둘 다)    | 규칙 변경 시 |

---

## ⚡ Vercel 배포 상태 확인

배포 후 확인:

- Vercel Dashboard: https://vercel.com/dashboard
- 배포 완료까지 약 2-3분 소요
- 자동으로 프로덕션 URL에 반영됨

---

## 🎯 간단 정리

**일반적인 개발 흐름:**

```bash
# 1. 코드 수정
# 2. 배포
git add .
git commit -m "기능 추가"
git push origin main

# 끝! Vercel이 알아서 배포합니다 ✅
```

**Firestore 규칙 수정 시:**

```bash
# firestore.rules 수정 후
npm run deploy:firebase
```

**둘 다 바꿨을 때:**

```bash
npm run deploy
```

---

## 🛠️ 배포 오류 해결

### Vercel 배포 실패 시

- Vercel Dashboard에서 로그 확인
- 빌드 에러는 대부분 TypeScript 타입 오류

### Firebase 배포 실패 시

- Firebase 로그인 확인: `npx firebase login`
- 프로젝트 확인: `npx firebase projects:list`

---

## 💡 추천 흐름

**대부분의 경우:**

```bash
git push origin main  # 이것만!
```

**Firebase 규칙도 바꿨다면:**

```bash
npm run deploy  # 한 방에!
```

간단하죠? 😊
