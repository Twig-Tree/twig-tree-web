"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CircleDot,
  GitBranch,
  Layers3,
  LockKeyhole,
  MousePointerClick,
  Palette,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  getLearningCheckpointStatus,
  getRecommendedNextCheckpoint,
  LearningCheckpointCard,
  LearningPathGraph,
  LearningProgressBar,
  LearningSlidePanel,
  sampleLearningPath,
  type LearningCheckpointStatus,
  type LearningProgress,
} from "@/src/features/learning-path";
import { routes } from "@/src/shared/config/routes";

const EMPTY_PROGRESS: LearningProgress = {
  activeCheckpointId: null,
  completedCheckpointIds: [],
};

const statusSpecimens: Array<{
  status: LearningCheckpointStatus;
  checkpointIndex: number;
  name: string;
  description: string;
}> = [
  {
    status: "available",
    checkpointIndex: 0,
    name: "학습 가능",
    description: "선수 조건이 충족되어 바로 시작할 수 있는 진입점입니다.",
  },
  {
    status: "current",
    checkpointIndex: 2,
    name: "학습 중",
    description: "사용자가 지금 보고 있는 위치를 인디고 테두리로 강조합니다.",
  },
  {
    status: "completed",
    checkpointIndex: 3,
    name: "완료",
    description: "학습을 끝낸 단계입니다. 보충 경로의 종류도 함께 드러납니다.",
  },
  {
    status: "locked",
    checkpointIndex: 5,
    name: "선수 학습 필요",
    description: "아직 열리지 않은 단계지만 선택하면 잠긴 이유를 안내합니다.",
  },
];

const panelPresets = {
  empty: {
    label: "시작 전",
    description: "아직 선택한 단계가 없을 때 첫 행동을 제안합니다.",
    selectedCheckpointId: null,
    progress: EMPTY_PROGRESS,
  },
  active: {
    label: "학습 중",
    description:
      "현재 개념, 학습 이유, 선택 경로와 다음 행동을 한곳에 모읍니다.",
    selectedCheckpointId: "variable-generation",
    progress: {
      activeCheckpointId: "variable-generation",
      completedCheckpointIds: ["transition-overview", "renewable-fundamentals"],
    },
  },
  locked: {
    label: "잠긴 단계",
    description: "진입을 막는 대신 필요한 선수 학습과 이동 행동을 설명합니다.",
    selectedCheckpointId: "transition-strategy",
    progress: EMPTY_PROGRESS,
  },
  completed: {
    label: "완료 단계",
    description: "완료 표시를 유지하면서 다음 권장 단계 이동을 제공합니다.",
    selectedCheckpointId: "variable-generation",
    progress: {
      activeCheckpointId: "grid-flexibility",
      completedCheckpointIds: [
        "transition-overview",
        "renewable-fundamentals",
        "variable-generation",
      ],
    },
  },
} satisfies Record<
  string,
  {
    label: string;
    description: string;
    selectedCheckpointId: string | null;
    progress: LearningProgress;
  }
>;

type PanelPresetKey = keyof typeof panelPresets;

const tokens = [
  {
    name: "Primary",
    value: "Indigo 600",
    className: "bg-indigo-600",
    use: "현재 위치와 주요 행동",
  },
  {
    name: "Completed",
    value: "Emerald 50 / 700",
    className: "bg-emerald-600",
    use: "완료 상태와 성공 피드백",
  },
  {
    name: "Optional",
    value: "Violet 500",
    className: "bg-violet-500",
    use: "보충·심화 선택 경로",
  },
  {
    name: "Locked",
    value: "Slate 200 / 500",
    className: "bg-slate-400",
    use: "비활성 단계와 보조 정보",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold tracking-[0.18em] text-indigo-600 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function SpecimenLabel({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div className="border-t border-slate-200 px-4 py-4">
      <p className="text-sm font-semibold text-slate-900">{name}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

export default function LearningPathPalettePage() {
  const [panelPreset, setPanelPreset] = useState<PanelPresetKey>("active");
  const [demoProgress, setDemoProgress] =
    useState<LearningProgress>(EMPTY_PROGRESS);
  const [demoPreviewId, setDemoPreviewId] = useState<string | null>(null);
  const [isDemoPanelOpen, setIsDemoPanelOpen] = useState(true);
  const selectedPreset = panelPresets[panelPreset];
  const demoSelectedId = demoPreviewId ?? demoProgress.activeCheckpointId;

  const completedCount = demoProgress.completedCheckpointIds.length;
  const demoSummary = useMemo(
    () =>
      completedCount === 0
        ? "아직 시작 전"
        : `${completedCount}개 체크포인트 완료`,
    [completedCount],
  );

  const selectDemoCheckpoint = (checkpointId: string) => {
    const checkpoint = sampleLearningPath.checkpoints.find(
      (candidate) => candidate.id === checkpointId,
    );

    if (!checkpoint) return;

    setIsDemoPanelOpen(true);

    if (getLearningCheckpointStatus(checkpoint, demoProgress) === "locked") {
      setDemoPreviewId(checkpointId);
      return;
    }

    setDemoPreviewId(null);
    setDemoProgress((current) => ({
      ...current,
      activeCheckpointId: checkpointId,
    }));
  };

  const completeDemoCheckpoint = (checkpointId: string) => {
    const completedProgress: LearningProgress = {
      activeCheckpointId: checkpointId,
      completedCheckpointIds: Array.from(
        new Set([...demoProgress.completedCheckpointIds, checkpointId]),
      ),
    };
    const nextCheckpoint = getRecommendedNextCheckpoint(
      sampleLearningPath,
      completedProgress,
      checkpointId,
    );

    setDemoPreviewId(null);
    setDemoProgress({
      ...completedProgress,
      activeCheckpointId: nextCheckpoint?.id ?? checkpointId,
    });
  };

  const resetDemo = () => {
    setDemoProgress(EMPTY_PROGRESS);
    setDemoPreviewId(null);
    setIsDemoPanelOpen(true);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f6f7fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={routes.learningPath("1")}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-700"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              조립된 학습 화면
            </Link>
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Prototype inventory · v1
            </span>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-indigo-600">
                <Palette aria-hidden="true" className="size-5" />
                <span className="text-sm font-semibold">
                  Learning Path UI Palette
                </span>
              </div>
              <h1 className="mt-4 max-w-4xl text-4xl leading-tight font-semibold tracking-[-0.035em] text-slate-950 lg:text-5xl">
                학습 경로를 이루는 조각과
                <br className="hidden sm:block" /> 그 조각이 필요한 이유
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
                완성 화면을 상태, 연결, 진행, 행동 단위로 해체했습니다. 각
                표본은 실제 프로토타입 컴포넌트를 사용하므로 제품 화면과 함께
                바뀝니다.
              </p>
            </div>

            <dl className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {[
                ["7", "체크포인트"],
                ["4", "상태"],
                ["2", "경로 종류"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="border-r border-slate-200 px-3 py-5 text-center last:border-r-0"
                >
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-1 text-xl font-semibold text-slate-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <nav aria-label="팔레트 섹션" className="mt-10 flex flex-wrap gap-2">
            {[
              ["#assembled", "조립 예시"],
              ["#nodes", "체크포인트"],
              ["#connections", "연결 규칙"],
              ["#progress", "진행률"],
              ["#panels", "패널 상태"],
              ["#tokens", "토큰"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-700"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-24 px-6 py-16 lg:px-10">
        <section id="assembled" className="scroll-mt-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <SectionHeading
              eyebrow="01 · Assembled"
              title="먼저, 조립된 경험"
              description="그래프는 전체 과정에서의 위치를, 우측 패널은 지금 해야 할 일을 설명합니다. 아래 미니 데모에서 실제 진행 흐름을 시험할 수 있습니다."
            />
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
              <CircleDot
                aria-hidden="true"
                className="size-4 text-indigo-600"
              />
              <span>{demoSummary}</span>
              <button
                type="button"
                onClick={resetDemo}
                className="ml-2 inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-indigo-700"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
                초기화
              </button>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)]">
            <div className="flex h-[580px] min-w-[860px]">
              <div className="min-w-0 flex-1">
                <LearningPathGraph
                  key={isDemoPanelOpen ? "palette-open" : "palette-closed"}
                  learningPath={sampleLearningPath}
                  progress={demoProgress}
                  onSelectCheckpoint={selectDemoCheckpoint}
                />
              </div>
              {isDemoPanelOpen ? (
                <LearningSlidePanel
                  learningPath={sampleLearningPath}
                  progress={demoProgress}
                  selectedCheckpointId={demoSelectedId}
                  onSelectCheckpoint={selectDemoCheckpoint}
                  onCompleteCheckpoint={completeDemoCheckpoint}
                  onClose={() => setIsDemoPanelOpen(false)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDemoPanelOpen(true)}
                  className="w-12 shrink-0 border-l border-slate-200 bg-white text-xs font-semibold tracking-wider text-slate-500 [writing-mode:vertical-rl] hover:bg-slate-50 hover:text-indigo-700"
                >
                  학습 패널 열기
                </button>
              )}
            </div>
          </div>
        </section>

        <section id="nodes" className="scroll-mt-8">
          <SectionHeading
            eyebrow="02 · Checkpoint states"
            title="하나의 카드, 네 가지 상태"
            description="형태는 유지하고 테두리, 표면색, 아이콘만 바꿔 사용자가 경로 전체를 빠르게 읽도록 합니다. 종류 배지는 단계의 역할을, 상태 표시는 지금 가능한 행동을 답합니다."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statusSpecimens.map((specimen) => (
              <article
                key={specimen.status}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="grid min-h-52 place-items-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:18px_18px] p-6">
                  <LearningCheckpointCard
                    checkpoint={
                      sampleLearningPath.checkpoints[specimen.checkpointIndex]
                    }
                    status={specimen.status}
                  />
                </div>
                <SpecimenLabel
                  name={specimen.name}
                  description={specimen.description}
                />
              </article>
            ))}
          </div>
        </section>

        <section id="connections" className="scroll-mt-8">
          <SectionHeading
            eyebrow="03 · Connection rules"
            title="선은 포함 관계가 아니라 학습 순서를 말합니다"
            description="분석 트리의 부모–자식 선과 혼동되지 않도록 화살표 방향과 선의 질감으로 필수 흐름과 선택 흐름을 구분합니다."
          />

          <div className="mt-8 grid overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-2">
            <article className="border-b border-slate-200 p-7 lg:border-r lg:border-b-0">
              <div className="flex h-28 items-center rounded-xl bg-slate-50 px-8">
                <span className="size-3 rounded-full border-2 border-slate-500 bg-white" />
                <span className="h-0.5 flex-1 bg-slate-500" />
                <ArrowRight
                  aria-hidden="true"
                  className="-ml-1 size-5 text-slate-500"
                />
              </div>
              <div className="mt-5 flex items-start gap-3">
                <span className="rounded-md bg-slate-100 p-2 text-slate-600">
                  <Layers3 aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    핵심 경로 · 실선
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    기본으로 따라야 할 학습 순서입니다. 완료 후 다음 권장 단계도
                    이 흐름을 따릅니다.
                  </p>
                </div>
              </div>
            </article>

            <article className="p-7">
              <div className="flex h-28 items-center rounded-xl bg-violet-50/60 px-8">
                <span className="size-3 rounded-full border-2 border-violet-500 bg-white" />
                <span className="h-0.5 flex-1 border-t-2 border-dashed border-violet-400" />
                <ArrowRight
                  aria-hidden="true"
                  className="-ml-1 size-5 text-violet-500"
                />
              </div>
              <div className="mt-5 flex items-start gap-3">
                <span className="rounded-md bg-violet-100 p-2 text-violet-700">
                  <GitBranch aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    선택 경로 · 점선
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    보충하거나 더 깊게 학습하는 분기입니다. 건너뛰어도 핵심
                    경로는 계속 진행됩니다.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="progress" className="scroll-mt-8">
          <SectionHeading
            eyebrow="04 · Progress"
            title="진행률은 핵심 경로만 계산합니다"
            description="선택 학습을 하지 않아도 완주할 수 있다는 규칙을 숫자에 반영합니다. 분자는 완료한 핵심 단계, 분모는 전체 핵심 단계입니다."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { completed: 0, total: 5, percentage: 0, label: "시작 전" },
              { completed: 2, total: 5, percentage: 40, label: "진행 중" },
              {
                completed: 5,
                total: 5,
                percentage: 100,
                label: "핵심 경로 완료",
              },
            ].map((progress) => (
              <article
                key={progress.label}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <LearningProgressBar {...progress} />
                <p className="mt-5 text-xs font-semibold text-slate-500">
                  {progress.label}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="panels" className="scroll-mt-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="05 · Slide panel"
              title="상황에 따라 다음 행동을 바꾸는 패널"
              description="패널은 설명만 담는 서랍이 아니라 학습 흐름을 계속 이어 주는 내비게이션입니다. 상태를 골라 실제 패널 구성을 비교해 보세요."
            />
            <div
              role="tablist"
              aria-label="학습 패널 상태"
              className="flex flex-wrap rounded-xl border border-slate-200 bg-white p-1"
            >
              {(Object.keys(panelPresets) as PanelPresetKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={panelPreset === key}
                  onClick={() => setPanelPreset(key)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    panelPreset === key
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {panelPresets[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid overflow-hidden rounded-3xl border border-slate-200 bg-white lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="flex min-h-96 flex-col justify-between bg-slate-950 p-8 text-white lg:p-12">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-indigo-300 uppercase">
                  {selectedPreset.label}
                </p>
                <h3 className="mt-4 max-w-lg text-3xl leading-tight font-semibold tracking-tight">
                  {selectedPreset.description}
                </h3>
              </div>

              <div className="mt-12 grid gap-3 sm:grid-cols-2">
                {[
                  [BookOpen, "설명", "핵심 개념과 학습 이유"],
                  [MousePointerClick, "행동", "이전·완료·다음 이동"],
                  [LockKeyhole, "제약", "선수 단계와 잠금 사유"],
                  [Sparkles, "분기", "보충·심화 선택 학습"],
                ].map(([Icon, title, copy]) => {
                  const ItemIcon = Icon as typeof BookOpen;

                  return (
                    <div
                      key={title as string}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <ItemIcon
                        aria-hidden="true"
                        className="size-4 text-indigo-300"
                      />
                      <p className="mt-3 text-sm font-semibold">
                        {title as string}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {copy as string}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-[600px]">
              <LearningSlidePanel
                learningPath={sampleLearningPath}
                progress={selectedPreset.progress}
                selectedCheckpointId={selectedPreset.selectedCheckpointId}
                onSelectCheckpoint={() => undefined}
                onCompleteCheckpoint={() => undefined}
              />
            </div>
          </div>
        </section>

        <section id="tokens" className="scroll-mt-8 pb-8">
          <SectionHeading
            eyebrow="06 · Visual language"
            title="상태를 묶어 주는 작은 시각 규칙"
            description="색은 장식보다 의미 전달에 사용하고, 아이콘과 텍스트를 함께 배치해 색만으로 상태를 구분하지 않도록 했습니다."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tokens.map((token) => (
              <article
                key={token.name}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <span className={`block h-20 rounded-xl ${token.className}`} />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {token.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">{token.use}</p>
                  </div>
                  <code className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">
                    {token.value}
                  </code>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-indigo-600 p-7 text-white">
            <div>
              <p className="text-sm font-semibold">
                실제 흐름에서 다시 확인하기
              </p>
              <p className="mt-1 text-sm text-indigo-100">
                팔레트의 조각들이 하나의 학습 경험으로 어떻게 이어지는지
                확인합니다.
              </p>
            </div>
            <Link
              href={routes.learningPath("1")}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50"
            >
              조립 화면 열기
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
