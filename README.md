# 술술영어 PWA

카드로 술술 읽다 보면 이해되는 한국인 화자용 영어 학습 앱.
시제·조동사·관계대명사·가정법 같은 문법 핵심을 **비유 카드 + 인출 퀴즈**로 익힙니다.
모바일 우선 PWA — 한 번 설치하면 오프라인 학습 가능.

🌐 라이브 데모: **https://nulmaru.github.io/sulsul/** *(GitHub Pages 활성화 후)*

## 스마트폰에 설치하기

브라우저로 라이브 데모에 접속한 뒤:

- **iOS Safari**: 공유 아이콘 → "홈 화면에 추가"
- **Android Chrome**: 우측 상단 ⋮ → "홈 화면에 추가" 또는 화면 하단 설치 배너 탭
- 데스크톱(Chrome/Edge): 주소창 우측 설치(⊕) 아이콘

설치하면 일반 앱처럼 홈 화면에서 바로 열 수 있고, 스플래시·전체화면·오프라인 캐시까지 작동합니다.

## 핵심 기능

- **3 stage × 6강 = 18강 + 보스 퀴즈 3개** (총 ~194문항)
  - Stage 1 왕초보 코어: 시제 5종 + 발음·축약·연음 (lesson 17)
  - Stage 2 일상 회화 확장: to/-ing, 가주어 It, There is, 조동사, 현재완료
  - Stage 3 심화: that절, when/if/because, 관계대명사, 조동사 심화, **수동태 (lesson 18)**, 가정법
- **자동 음성 내레이션** — 4단계 (꺼짐 / 예문만 / 카드+예문 / 전체) + 한국어·영어 voice 분리 선택 + 미리듣기
- **강 시작 인트로 화면** — 제목·부제 한국어 자동 내레이션
- **SRS 복습** + 미니세션(1분/5장/오답만) + 일일 목표 링 + Streak freeze
- **PWA**: 오프라인 캐시, 홈 화면 단축키(오늘의 복습 / 1분 복습 / 오답 복습), 시스템 알림(권한 시)
- 다크 모드, 폰트 크기 3단계, TTS 속도·pitch, 한손 조작 + 키보드 단축키(←/→)

## 개발

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest 단위 테스트
npm run lint     # ESLint
npm run build    # 프로덕션 빌드 (BASE_PATH=/ 로 루트 배포 가능)
npm run icons    # public/icons/source.svg → PNG 재생성
```

스택: Vite 8 + React 19 + TypeScript strict + Tailwind 3 + Zustand + Dexie + framer-motion + vite-plugin-pwa.
라우팅은 HashRouter — 정적 호스팅(GitHub Pages 포함) 어디든 호환됩니다.

## GitHub Pages 배포

이 저장소에는 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)가 들어있어,
`main` 브랜치에 push 하면 자동으로 빌드·배포됩니다. 최초 한 번만 GitHub 설정에서:

1. 저장소 → **Settings → Pages**
2. **Source**를 `GitHub Actions`로 변경
3. 다음 push 또는 `Actions` 탭에서 워크플로 수동 실행 → `https://<user>.github.io/sulsul/`에 게시

루트 도메인(`/`)에 배포하려면 빌드 시 `BASE_PATH=/`를 넘기거나 [vite.config.ts](vite.config.ts)에서 기본값을 변경하세요.

## 디렉토리 구조

```
src/
├── data/
│   ├── stages.json                ← 3 stage × 6강 정의
│   ├── lessons/lesson-01..18.json ← 강 콘텐츠 (cards + 메타)
│   └── quizzes/lesson-01..18, boss-stage-1..3.json
├── routes/        ← Home/Stages/Lesson/Quiz/Review/Bookmarks/Settings
├── components/    ← card / quiz / shadowing / ui
├── stores/        ← progress / settings / audio (Zustand)
├── lib/           ← tts / srs / db / grading / notification / resume / sessionTimer
├── i18n/ko.ts     ← 한국어 문자열
└── styles/        ← Tailwind + theme tokens
```

## 콘텐츠 메모

- 비유 시스템: 시제 = 옷 갈아입기, to/-ing = 화살표 vs 익숙함, 절 = 끈/상자,
  가정법 = 시제 한 칸 뒤로, 수동태 = 카메라 앵글 회전.
- 콘텐츠는 한국어 직관에 맞춘 자작이며, 출처 표기는 보류 중입니다(개인 사용 시점, 추후 협의 후 추가).

## 라이선스

미정. 현재는 개인 사용·공유 목적으로 운영되고 있어요.
