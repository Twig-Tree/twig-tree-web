import type { Metadata } from "next";
import { LandingPage } from "@/src/widgets/landing";

export const metadata: Metadata = {
  title: "Twig Tree — 흩어진 지식을 하나의 트리로",
  description:
    "문서를 올리면 AI가 개념을 트리로 구조화하고, 그 트리를 따라 강의까지 들려드려요.",
};

export default function Page() {
  return <LandingPage />;
}
