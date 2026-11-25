# 소개(랜딩) 페이지 구현 계획 (#210)

참고: `docs/landing/HANDOFF.md`, `docs/landing/twig-landing-design.html`

## 현재 구조에서 걸리는 점

| 사실                                                                                                         | 영향                                                              |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `app/page.tsx`가 `/` → `/dashboard`로 바로 redirect                                                          | 랜딩이 `/`를 차지하려면 이 파일을 지운다                          |
| `app/layout.tsx`가 앱 상단바(Network 아이콘 + "Twig Tree")와 `h-dvh` 셸을 그리고, `body`가 `overflow-hidden` | 랜딩에도 앱 상단바가 붙고 페이지가 스크롤되지 않는다              |
| 테마 규칙: 컴포넌트에 색 값·기본 팔레트 금지, `rawColors.test.ts`가 CI에서 검사                              | 시안의 hex 값을 그대로 쓸 수 없다                                 |
| 제품 테마(Neutral)의 accent는 인디고(`#4f46e5`)                                                              | 시안의 그린 브랜드 색은 기존 토큰에 없다                          |
| 프로젝트는 FSD(`components/` 없음), 폰트 설정 없음, 로고 파일 없음                                           | 지시서의 `components/landing/` 대신 `src/widgets/landing/`에 둔다 |
| `restoreSession()`·`authSession`이 이미 있음                                                                 | 로그인 사용자 redirect를 자리만이 아니라 실제로 구현할 수 있다    |

## 결정 사항 (추천)

1. **라우트**: `app/(landing)/page.tsx`가 `/`. `app/page.tsx` 삭제.
2. **레이아웃 분리**: 앱 상단바와 `h-dvh`/`overflow-hidden` 셸을 `src/widgets/app-shell`로 옮기고 `(main)`·`(auth)`·`(dev)` layout이 감싼다. 루트 layout은 html/body/Provider/Toaster만 남긴다. 기존 화면의 모양은 그대로다.
3. **색**: 랜딩은 테마를 따르지 않는 고정 브랜드 팔레트로 둔다(시안 자체에 다크 섹션이 있고, 로그인 전 화면이라 사용자가 고른 테마를 적용할 이유가 약함).
   - `app/themes/landing.css`에 Tailwind `@theme`로 `--color-landing-ink`, `--color-landing-green` … 정의 → 컴포넌트는 `bg-landing-green`처럼 역할 이름만 쓴다.
   - `themes.test.ts`가 테마 파일로 읽지 않도록 `tokens.css`처럼 제외하고, `docs/conventions/theming.md`에 "랜딩 브랜드 팔레트" 절을 추가한다.
4. **애니메이션**: `framer-motion`은 `motion`으로 이름이 바뀌었으므로 `motion` 패키지(`motion/react`)를 설치한다. API는 동일.
5. **폰트**: `next/font/google`의 Inter + Noto Sans KR을 랜딩 루트에만 className으로 적용한다. 앱 화면 폰트는 건드리지 않는다.
6. **위치(FSD)**: `src/widgets/landing/`
   ```text
   ui/      LandingPage, TopBar, Hero, HeroTree, Problem, HowItWorks, AiTreeFeature,
            LectureDemo, EditMemoSearch, UserTestStats, FinalCta, Footer, Logo, Reveal
   model/   lectureDemoData.ts (NODES·SEQ·NOTES), useLectureDemoPlayer.ts
   index.ts
   ```

## 시안에서 바꾸면 좋을 점 (추천)

- "로그인"·"무료로 시작하기"(Hero, CTA) → 시안은 `#start`/`#top` 앵커지만 실제로는 `/login`으로 보낸다.
- 강의 데모: 시안은 정지 상태로 시작한다. **섹션이 화면에 들어오면 자동 재생**하고, 벗어나면 멈춘다. "30초 데모 보기"를 누르면 스크롤 후 재생. `prefers-reduced-motion`이면 자동 재생하지 않고 카메라 이동도 즉시 전환. 해설 문단은 `aria-live="polite"`.
- 검색 카드의 `<input value="교착 상태">`는 실제 입력처럼 포커스되지만 아무 동작도 없다 → 입력창처럼 보이는 정적 요소로 바꾼다.
- h1 64px / h2 40~52px는 모바일에서 넘치므로 `clamp()`로 줄인다.
- 통계 `[N]%` 플레이스홀더는 지시대로 유지.

## 단계 (단계마다 확인 → 커밋)

1. **레이아웃 분리** — app-shell 위젯 추출, 세 route group layout에 적용, 루트 layout 정리. 기존 화면 동일한지 확인.
2. **기반** — `motion` 설치, 랜딩 팔레트·폰트, `Logo`, `/` 라우트에 TopBar + Footer 골격, `app/page.tsx` 삭제, 테스트·문서 갱신.
3. **정적 섹션** — Hero(HeroTree), Problem, HowItWorks, AiTreeFeature, EditMemoSearch(flex-wrap), UserTestStats, FinalCta. 반응형 확인.
4. **트리 강의 데모** — 데이터, `useLectureDemoPlayer`(이전/다음/재생/3.6초 진행/끝나면 처음), 카메라 `motion.div`, 컨트롤·진행바·카운터. hook 테스트(fake timers).
5. **애니메이션** — Hero 연결선 `pathLength`, 노드 순차 등장, 섹션·카드 `whileInView` stagger, reduced motion 처리.
6. **로그인 사용자 redirect** — `useRedirectIfAuthenticated`: access token이 있거나 `restoreSession()`이 `restored`면 `/dashboard`로 `replace`. 확인 중에도 랜딩은 그대로 보인다.

## 확정

- Footer GitHub 링크: `https://github.com/Twig-Tree`
- 6단계 redirect: 실제로 구현한다

## 진행 메모

- 1단계: `AppShell`은 `(main)`에서 `AuthGate` 바깥에 둔다. 인증 확인 중에도 상단바가 보이던 기존 동작을 유지한다.
- 로컬 Node 25에서는 내장 `localStorage`가 jsdom 것을 덮어 테스트가 대량 실패한다(프로젝트 엔진은 Node 24). `NODE_OPTIONS=--no-experimental-webstorage`로 돌리면 기존 실패 3건(multipart 요청 timeout)만 남고, 이 3건은 변경 전에도 실패한다.
