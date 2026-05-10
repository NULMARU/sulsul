# 다음 세션 시작 가이드 — 술술영어 PWA

## TL;DR

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest 단위 테스트 (14개)
npm run lint     # ESLint
npm run build    # 프로덕션 빌드 (BASE_PATH=/sulsul/ 기본값)
npm run icons    # public/icons/source.svg → PNG 재생성
```

라이브: **https://nulmaru.github.io/sulsul/** (Pages 활성화 필요)
저장소: https://github.com/NULMARU/sulsul
첫 화면 핵심 동작: 인트로 → 카드 swiper → 인터스티셜 → 강 종료 퀴즈 → 결과 → 다음 강

## 콘텐츠 현황

| 항목 | 값 |
|---|---|
| Stage | 3개 (모두 처음부터 잠금 해제) |
| 강 | 18 (Stage 1: 1–5,17 / Stage 2: 6–10,14 / Stage 3: 11–13,15,16,18) |
| 강당 퀴즈 | 강마다 1 인터스티셜 + 7~8 종료 |
| 보스 퀴즈 | Stage 1: 15문항 / Stage 2: 14 / Stage 3: 17 |
| **총 문항** | **약 194** |

**신설 강**:
- `lesson-17` 발음의 결 — 축약(I'm/She's/won't), 연음(What are → 와류), wanna/gonna, 강세 리듬
- `lesson-18` 수동태 — be + p.p., 카메라 앵글 비유, by 생략, be born

**보강된 강**:
- `lesson-10` 현재완료 신호어 위치(yet 끝, already 가운데)
- `lesson-14` must vs have to, can vs be able to 미세차이
- `lesson-15` had better(should보다 강한 충고)
- 함정 정제: lesson-01 q-fin-06, lesson-14 q-fin-06

## 음성 / 내레이션 시스템

- [src/lib/tts.ts](src/lib/tts.ts) — 한·영 voice 분리 캐시 + 음질 점수화 + 큐레이션 + 혼합언어 segment + iOS engine prime
- 4단계 자동 내레이션: 꺼짐 / 예문만 / 카드+예문 / 전체(퀴즈 prompt 포함)
- 강 시작 인트로 ([LessonIntroScreen.tsx](src/components/card/LessonIntroScreen.tsx)) — 한국어 자동 내레이션
- Settings에서 영어/한국어 voice 분리 픽커 + ▶ 미리듣기 + pitch(낮게/기본/밝게)

## 짬짬이 학습 기능

- 알림 모듈 ([notification.ts](src/lib/notification.ts)) + 권한 흐름 + due 토스트
- Deep resume ([resume.ts](src/lib/resume.ts)) — sessionStorage + localStorage
- 학습 시간 추적 ([sessionTimer.ts](src/lib/sessionTimer.ts)) + 일일 목표 ring
- 미니세션 chips: `/review?n=3 | n=5 | wrong=1`
- PWA shortcuts (manifest)
- Streak freeze (7일마다 1일 패스 충전)

## 빌드 / 배포

- `npm run build` 기본값은 `/sulsul/` base — GitHub Pages 경로용
- 루트 도메인 배포: `BASE_PATH=/ npm run build`
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) — main push 시 자동 배포 (GitHub Pages 활성화 필요)

## 알려진 한계

- Web Speech API: 화면 잠그면 TTS 일시정지 (백그라운드 재생 불가)
- 사용 가능 voice는 OS·브라우저별로 달라짐 — 점수화로 최선 자동 선택, 큐레이션 픽커로 사용자 직접 변경
- iOS Premium voice는 사용자가 시스템 설정 → 손쉬운 사용에서 다운로드해야 활성화

## 보류 / 추후 결정

- 콘텐츠 출처·저작권 표기 — 개인 사용 시점이라 미표시. 다인 공유 전환 시 협의 후 추가
- 콘텐츠 톤 검수: 사용자가 직접 풀어보고 어색한 표현이 있으면 강·문항 단위로 수정
- 보스 퀴즈 난이도: Stage별 13/14/15 → 17/15/17로 보강됐으나 더 다양화 가능

## 흔한 작업 프롬프트

```
src/data/lessons/lesson-XX.json 카드 톤이 부록 A 비유와 다른 것 같아. 다듬어줘.
```

```
설정 화면의 음성 선택 영역을 [구체적 변화]로 바꿔줘.
```

```
Stage 2-B에 [새 주제]를 lesson-19로 추가해줘. 8카드 + 7문항.
```

## 주요 파일 인덱스

```
src/
├── data/
│   ├── stages.json
│   ├── lessons/lesson-01..18.json
│   └── quizzes/lesson-01..18.json + boss-stage-1..3.json
├── routes/        Home, Stages, Lesson, Quiz, Review, Bookmarks, Settings
├── components/
│   ├── card/      LessonCard, CardSwiper, ExampleBlock, TtsButton, LessonIntroScreen
│   ├── quiz/      QuizRunner, MultipleChoice, OxQuiz, FillBlank, WordArrange, SituationMatch
│   ├── shadowing/ ShadowingPanel, Recorder
│   └── ui/        Button, Progress (Dots/Ring), Sheet, Toast, useToast
├── stores/        progressStore, settingsStore, audioStore
├── lib/           tts, srs, db, grading, content, notification, resume, sessionTimer, haptic, recorder
├── i18n/ko.ts
└── styles/        globals.css, theme.css
```
