import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";

type TaggedItem = BreadcrumbItem & { tag: string };

const items: TaggedItem[] = [
  { label: "내 폴더", href: "/directory", tag: "root" },
  { label: "기획", tag: "current" },
];

describe("Breadcrumb", () => {
  it("renderItem이 없으면 링크와 현재 위치를 그대로 그린다", () => {
    render(<Breadcrumb items={items} />);

    expect(screen.getByRole("link", { name: "내 폴더" })).toHaveAttribute(
      "href",
      "/directory",
    );
    expect(screen.getByText("기획")).toHaveAttribute("aria-current", "page");
  });

  it("renderItem은 호출부가 더한 필드와 기본 내용을 받아 감싼다", () => {
    render(
      <Breadcrumb
        items={items}
        renderItem={(item, content) => (
          <span data-testid={`wrap-${item.tag}`}>{content}</span>
        )}
      />,
    );

    expect(screen.getByTestId("wrap-root")).toContainElement(
      screen.getByRole("link", { name: "내 폴더" }),
    );
    expect(screen.getByTestId("wrap-current")).toHaveTextContent("기획");
  });
});
