import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routes } from "@/src/shared/config/routes";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("기본으로 상단바 로고가 대시보드로 이동한다", () => {
    render(<AppShell>화면</AppShell>);

    expect(
      screen.getByRole("link", { name: "Twig Tree 대시보드로 이동" }),
    ).toHaveAttribute("href", routes.dashboard);
  });

  it("로그인 전 화면에서는 상단바 로고가 소개 페이지로 이동한다", () => {
    render(<AppShell home="landing">화면</AppShell>);

    expect(
      screen.getByRole("link", { name: "Twig Tree 소개 페이지로 이동" }),
    ).toHaveAttribute("href", routes.landing);
  });
});
