import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MediaFallback } from "@/components/portfolio/media-fallback";

describe("MediaFallback", () => {
  it("renders an accessible placeholder while a Storage signed URL is unavailable", () => {
    render(<MediaFallback src={undefined as unknown as string} alt="작업 후 사진" sizes="100vw" />);

    expect(screen.getByRole("img", { name: "작업 후 사진 — 이미지를 불러오지 못했습니다" })).toBeInTheDocument();
    expect(screen.getByText("이미지를 불러오지 못했습니다")).toBeInTheDocument();
  });
});
