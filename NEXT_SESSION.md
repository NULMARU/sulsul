# 다음 세션 시작 가이드 — 술술영어 PWA

## TL;DR

```bash
cd C:\dev\sulsul-pwa
npm run dev      # 개발 서버 (http://localhost:5173)
npm test         # 단위 테스트 (vitest)
npm run build    # 프로덕션 빌드
npm run icons    # 아이콘 SVG → PNG 재생성 (디자인 변경 시)
```

## 현재 상태 (2026-05-07 기준)

### ✅ 완료
- **M1~M7**: SPEC.md의 7개 마일스톤 모두 구현 완료
- **M8 콘텐츠**: lesson-01 ~ lesson-16 + boss-stage-1/2/3 모두 작성. 부록 A 비유 어휘 차용으로 톤 일관 유지. 강당 8카드 + 인터스티셜 1 + 종료 7 = 128문항. 보스 퀴즈 13+14+15 = 42문항. **총 170문항** (SPEC §5.6 목표 도달).
- **검수 통과**: 골든 패스(홈 → 카드 → 퀴즈 → 결과 + 보스 퀴즈) 브라우저 검증, 콘솔 에러 0건
- **테스트**: `grading.ts` 8개 / `srs.ts` 6개 — 14개 모두 통과
- **빌드**: TS strict 통과, 프로덕션 빌드 성공
- **번들 사이즈** (lazy route 분할 후):
  - 메인 진입: 77.2 KB (gzip) — SPEC 목표 200 KB 이하 달성
  - 강별 콘텐츠 chunk 1.3–1.9 KB / 보스 chunk 2.0–2.1 KB
- **아이콘**: 말풍선 + 3-dots 디자인 (192/512/maskable PNG 생성됨)
- **저작권 표기**: 제거됨 (개인 사용 시점, 추후 다인 사용 시 협의 후 표시)
- **SituationMatch 컴포넌트 hydration 경고 제거** — 옵션 button 안에 TtsButton(button)이 중첩되던 구조를 div 래퍼 + 형제 button 두 개로 분리.
- **Stage Boss 퀴즈 라우트 연결** — `QuizRoute.tsx`가 `boss-` 접두사 ID를 감지해 `-fin-` 필터를 건너뛰도록 수정. `StagesRoute`에 "👑 Stage Boss 퀴즈" 버튼 추가 (해당 stage 100% 완료 시 또는 `unlockAllStages` 설정 시 활성화).

### 🚧 미해결 / 보류 (사용자 결정 대기)
SPEC.md §12 항목:
1. ~~저작권 사용 범위~~ → 개인 사용, 표기 제거 (확정)
2. ~~콘텐츠 입력 주체~~ → AI 자율 작성으로 16강 + 보스 3 모두 완료 (확정)
3. ~~퀴즈 작성 주체~~ → AI 자율 작성으로 170문항 모두 완료 (확정)
4. ~~앱 아이콘 디자인~~ → 말풍선 + 3-dots (확정, 변경 원하면 `public/icons/source.svg` 수정 후 `npm run icons`)
5. **알림 도입 시점** — PWA Notification API 일일 복습 알림은 미구현 (옵션 토글만 있음)
6. ~~데스크톱 단축키~~ → ←/→ 화살표만, 추가 안 함 (확정)

## 다음으로 우선순위 제안

### A. 콘텐츠 톤·정확성 검수 (사용자 학습 후)
- 16강을 직접 풀어보고 부록 A 비유와 다르거나 어색한 표현이 있다면 lesson-XX.json / quizzes/lesson-XX.json 단위로 수정 가능
- 보스 퀴즈 난이도 조정도 같은 방식 (boss-stage-N.json)
- 콘텐츠는 부록 A 비유 + AI 자율 생성이라 원본 PDF 표현과 일부 다를 수 있음 — 필요 시 사용자가 원본 비교 후 교정

### B. 일일 복습 알림 (SPEC §M5 옵션)
- `src/lib/notification.ts` 신규 파일
- `Notification.requestPermission()` + Service Worker `showNotification()` + 매일 정해진 시각 트리거(BackgroundSync 또는 IndexedDB 큐 + 앱 오픈 시 체크)
- `settingsStore.notificationEnabled` 토글에 연결
- 가장 단순한 안: SW 외부에서 setInterval은 불가능하므로 "앱 오픈 시 due 카운트가 있으면 토스트로 알림" 정도부터 시작 가능

### C. 데스크톱 반응형 (SPEC §1.3)
- 현재 max-w-card (480px) 중앙 정렬 적용됨
- 더 넓은 화면용 좌측 사이드바(Stage 목록) + 메인 카드 영역 분리 레이아웃 검토 가능
- 모바일 우선이라 우선순위는 낮음

### D. 미구현 잔여 항목
- **prefetchLesson**: `src/lib/content.ts`에 함수는 있으나 `LessonRoute`에서 다음 강만 prefetch함. 전체 stage prefetch 옵션 가능
- **Notification permission flow UI**: `SettingsRoute`에 토글만 있고 권한 요청 흐름 없음
- **rolldown 코드 스플리팅 튜닝**: 현재 자동 split만 사용, 더 세밀하게 manual chunks 가능 (불필요할 가능성 높음)
- **i18n 확장**: `src/i18n/ko.ts`만 존재. 영어 UI 추가 시 i18next 도입 가능 (SPEC §10)

## 디렉토리 / 파일 위치 메모

```
C:\dev\sulsul-pwa\          ← 코드 (영문경로, OneDrive 외부)
├── public/icons/
│   ├── source.svg          ← 일반 아이콘 마스터 SVG (수정 → npm run icons)
│   ├── source-maskable.svg ← maskable 마스터 SVG (수정 → npm run icons)
│   └── icon-{192,512,maskable-512}.png  ← 자동 생성됨
├── scripts/gen-icons.mjs   ← SVG→PNG 변환 스크립트
├── src/
│   ├── data/
│   │   ├── stages.json     ← 3개 stage 정의
│   │   ├── lessons/lesson-01.json … lesson-16.json   ← 16강 모두 작성 완료
│   │   └── quizzes/
│   │       ├── lesson-01.json … lesson-16.json       ← 강당 1 인터 + 7 종료
│   │       └── boss-stage-1/2/3.json                  ← Stage Boss 13/14/15문항
│   ├── lib/                ← grading/srs/db/tts/recorder/content/haptic
│   ├── stores/             ← progressStore/settingsStore/audioStore
│   ├── components/{card,quiz,shadowing,ui}/
│   ├── routes/             ← Home/Stages/Lesson/Quiz/Review/Bookmarks/Settings
│   └── types/              ← content/quiz/progress 타입 정의
├── NEXT_SESSION.md         ← 이 파일
├── SPEC.md                 ← 원본 명세서 (읽기 전용 참고)
├── content_schema.json     ← JSON Schema (콘텐츠 작성 시 검증용 참고)
└── content_sample_lesson_01.json  ← 1강 샘플 (lesson-01.json과 동일)

C:\Users\simis\OneDrive\문서\ENG\  ← SPEC 원본 (이 폴더에서 새 세션 시작 시 작업 디렉토리가 됨)
```

## 새 세션 시작 시 사용할 프롬프트 예시

다음 세션에서 Claude Code를 다시 켜면 작업 디렉토리는 `C:\Users\simis\OneDrive\문서\ENG`로 시작됩니다. 코드는 `C:\dev\sulsul-pwa`에 있다는 점을 알려주세요.

### 콘텐츠 톤 교정
```
C:\dev\sulsul-pwa의 lesson-XX.json 카드 텍스트가 부록 A 비유와 다르게 느껴져.
원본 PDF의 표현은 "..."이야. 카드와 퀴즈 해설을 이 톤에 맞게 다듬어줘.
```

### 일일 복습 알림 구현
```
C:\dev\sulsul-pwa에서 SPEC.md §M5의 일일 복습 알림 기능을 구현해줘. 가장 단순한 방식
(앱 오픈 시 due 카운트 토스트 → 권한 요청 흐름 → SW showNotification 단계적 도입)으로
시작해줘.
```

### 그냥 이어서
```
C:\dev\sulsul-pwa의 술술영어 PWA NEXT_SESSION.md를 읽고 우선순위 A 작업을 진행해줘.
```

## 환경 / 결정사항 요약

| 항목 | 값 |
|---|---|
| 프로젝트 위치 | `C:\dev\sulsul-pwa` (OneDrive 외부, 영문 경로) |
| 패키지 매니저 | npm (pnpm 미사용) |
| Node 버전 | v22.17.1 |
| 핵심 스택 | Vite 8 + React 19 + TS strict + Tailwind 3 + Zustand + Dexie + framer-motion + vite-plugin-pwa |
| 라우팅 | HashRouter (정적 호스팅 호환) |
| 라우트 코드 분할 | React.lazy (Home 외 모두 lazy) |
| 테스트 | Vitest |
| 다크모드 | system / light / dark |
| 폰트 | Pretendard Variable (CDN) + Inter/system for English |
| 콘텐츠 출처 표기 | **하지 않음** (개인 사용, 추후 협의 시 추가) |
| PWA 아이콘 | 말풍선 + 3-dots, 노란색(#F5C842) (말하기·회화·언어 학습 상징) |
