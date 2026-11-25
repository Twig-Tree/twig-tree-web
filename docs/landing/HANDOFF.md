# Twig Tree 소개(랜딩) 페이지 구현 지시서

> Claude Code에게: 이 문서와 같은 폴더의 `twig-landing-design.html`(디자인 시안 원본)을 참고해서
> 기존 Next.js 프로젝트에 소개 페이지를 구현해 줘. 시안의 레이아웃·색·카피를 최대한 그대로 옮기고,
> 애니메이션은 Framer Motion으로 구현해.

## 0. 작업 전 확인
- 프로젝트 구조(App Router/Pages Router, Tailwind 여부, 기존 폰트 설정)를 먼저 확인하고 거기에 맞춰.
- 라우트: 첫 진입 소개 페이지 (예: `app/(landing)/page.tsx` 또는 `/` ). 로그인한 사용자는 메인으로 리다이렉트할 수 있게 훅 자리만 남겨 둬.
- 패키지: `framer-motion` 없으면 설치.

## 1. 디자인 토큰
| 이름 | 값 | 용도 |
|---|---|---|
| ink | `#17211B` | 본문 글자, 다크 섹션 배경, 메인 버튼 |
| green | `#2F6B45` | 브랜드 메인(로고 "tree"), CTA 배경, 라벨 |
| leaf | `#58A86B` | 로고 잎/열매, 강조, 진행바 |
| leaf-soft | `#EAF4EC` / `#E7F2E9` | 배지, 아이콘 배경 |
| line | `#9CC5A6` | 트리 연결선 |
| surface | `#F5F8F4` | 연한 섹션 배경 |
| border | `#E1E8E2` | 카드 테두리 |
| muted | `#4A5A4F` | 본문 보조 텍스트 |
| dark-card | `#212D26`, border `#2E3D34` | 강의 섹션 카드 |
| dark-muted | `#C4D2C8`, `#A9B8AD`, `#8FA596` | 다크 섹션 보조 텍스트 |

- 폰트: Inter(라틴) + Noto Sans KR(한글). `next/font/google` 사용. (팀에서 Pretendard 쓰면 그걸로 교체)
- 제목: weight 800, letter-spacing -0.03 ~ -0.035em. h1 64px / h2 40px(강의 섹션 52px, CTA 48px).
- 라운드: 버튼 999px, 카드 20~28px, CTA 박스 36px.
- 컨테이너: `max-width: 1200px; padding: 0 24px`. 섹션 세로 패딩 96~112px.

## 2. 로고 (인라인 SVG 컴포넌트로)
```svg
<svg viewBox="0 0 48 48">
  <path d="M24 45V27M24 31C24 24 17 22 12 20M24 31C24 24 31 22 36 20"
        fill="none" stroke="#17211B" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="10" cy="19" r="5.5" fill="#58A86B"/>
  <circle cx="38" cy="19" r="5.5" fill="#58A86B"/>
  <path d="M24 27C17 22 17 11 24 4C31 11 31 22 24 27Z" fill="#58A86B"/>
</svg>
```
워드마크: `twig`(ink) + `tree`(green), Inter 800. 실제 로고 파일이 repo에 있으면 그걸 우선 사용.

## 3. 섹션 구성 (위→아래)
1. **TopBar** — 왼쪽 로고, 오른쪽 "로그인" 링크. 고정(sticky) 아님. 떠 있는 메뉴/스크롤스파이 없음.
2. **Hero** — 배지 "AI 지식 트리 서비스" / h1 "흩어진 지식,<br>한 그루의 트리로"("트리"만 green) / 서브카피 / 버튼 2개("무료로 시작하기", "30초 데모 보기"→#lecture). 오른쪽: 브라우저 창 카드 안에 트리 SVG(자료구조 → 선형/비선형 → 스택·큐·트리·그래프). 배경: 우상단 연한 그린 radial.
3. **Problem** — "PDF 30장, 어디서부터 읽어야 할까요?" + 카드 3개(긴 문서/흩어진 필기/반복 학습) + "Twig Tree는 문서를 '구조'로 바꿔요."
4. **How it works** (`id="features"`) — 01 문서 업로드 / 02 AI가 트리 생성 / 03 트리 강의로 학습(이 카드만 다크).
5. **AI 트리 생성** — 왼쪽 설명 + 체크 3개, 오른쪽 BEFORE(문서 라인) → 화살표 → AFTER(트리) 카드.
6. **트리 강의** (`id="lecture"`, 다크 배경, 시그니처) — 상세는 4번.
7. **편집·메모·검색** — flex-wrap 레이아웃:
   - 편집 카드 `flex: 2 1 520px`, 메모 카드(다크) `flex: 1 1 300px`, 검색 카드 `flex: 1 1 100%`.
   - ⚠️ CSS grid `auto-fit + span 2` 쓰지 말 것 (중간 폭에서 메모 카드가 좁게 남는 버그 있었음).
8. **사용자 테스트** — 통계 카드 3개. 값은 `[N]%` 플레이스홀더 유지(실제 설문 결과로 교체 예정, 임의 숫자 넣지 말 것).
9. **CTA** (`id="start"`) — green 박스, 흰색 로고, "첫 번째 트리를 심어보세요", 흰 버튼.
10. **Footer** — 워드마크 / "팀 백색소음 · 홍익대학교 컴퓨터공학과 졸업 프로젝트" / GitHub [링크].

## 4. 트리 강의 데모 (핵심 인터랙션)
- 실제 서비스처럼 **화면(카메라)이 노드를 따라 이동하며 해설**이 바뀌는 데모. 슬라이드 방식 아님.
- ❌ 강의 순서(목차) 패널 없음, ❌ 노드 클릭으로 이동 없음.
- 플레이어가 섹션 너비를 꽉 채움. 뷰포트 높이 420px, overflow hidden.
- 노드 데이터(트리 캔버스 560×340 기준, 노드 140×40 pill):
```ts
const NODES = [
  { id: 'A', label: '운영체제',   x: 20,  y: 170 },
  { id: 'B', label: '프로세스',   x: 210, y: 70  },
  { id: 'C', label: '메모리 관리', x: 210, y: 170 },
  { id: 'D', label: '파일 시스템', x: 210, y: 270 },
  { id: 'E', label: '스케줄링',   x: 400, y: 20  },
  { id: 'F', label: '동기화',     x: 400, y: 110 },
  { id: 'G', label: '가상 메모리', x: 400, y: 200 },
];
const SEQ = ['A', 'B', 'E', 'F', 'C', 'G'];
// 연결선: A→B, A→C, A→D, B→E, B→F, C→G (오른쪽 끝 중앙 → 왼쪽 끝 중앙, 베지어 곡선)
```
- 해설 문구(NOTES)는 시안 파일의 `<script>` 안 `NOTES` 객체 그대로 사용.
- 카메라: 트리 컨테이너를 뷰포트 `left:50%; top:50%`에 두고 `transform-origin: 0 0`,
  `x = -s*(node.x+70)`, `y = -s*(node.y+20)`, `scale = 1.3` → `motion.div`의 `animate`로 전달
  (`transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] }`).
- 노드 상태 스타일: 현재(leaf 배경 + 글로우 링) / 지나온 노드(green) / 나머지(어두운 회색).
- 컨트롤: 이전 · 재생/일시정지 · 다음 버튼(44px 이상), 진행바, "n / 6" 카운터. 재생 중 3.6초마다 다음 노드, 끝나면 처음으로.
  (실제 서비스 조작 방식과 다르면 맞춰서 수정 예정)

## 5. 애니메이션 (Framer Motion)
- Hero 트리: 연결선 `motion.path` `pathLength 0→1` (1.3s, 순차 delay), 노드 `opacity 0→1` 순차 등장.
- 각 섹션 제목/카드: `whileInView={{ opacity: 1, y: 0 }}` `initial={{ opacity: 0, y: 24 }}` `viewport={{ once: true, amount: 0.3 }}`, 카드는 stagger.
- `prefers-reduced-motion`이면 애니메이션 끄기 (`useReducedMotion`).

## 6. 반응형·접근성
- 히어로/AI 섹션은 flex-wrap으로 모바일에서 세로 스택.
- 아이콘 전용 버튼은 `aria-label`, 장식 SVG는 `aria-hidden`.
- 이모지 쓰지 말고 스트로크 SVG 아이콘 사용.

## 7. 컴포넌트 분리 제안
`components/landing/` 아래 `TopBar`, `Hero`, `HeroTree`, `Problem`, `HowItWorks`, `AiTreeFeature`, `LectureDemo`, `EditMemoSearch`, `UserTestStats`, `FinalCta`, `Footer`, `Logo`.
