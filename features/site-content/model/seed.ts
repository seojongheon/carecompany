import type { SiteContent, SiteContentSnapshot } from "./types";

export const SITE_CONTENT_SEED: SiteContent = {
  home: { eyebrow: "천안·아산 청소 포트폴리오", title: "말보다 현장으로 보여드리는 청소", description: "화장실부터 에어컨, 아파트와 상가 유리창까지. 공개 전 개인정보를 확인한 작업 사례로 필요한 서비스를 살펴보세요.", primaryCtaLabel: "작업 사례 보기", primaryCtaHref: "/portfolio", heroImageAlt: "청소 결과를 상징하는 파란색 그래픽", heroAssetKey: "commercial-window.svg" },
  pricingLead: "현장 사례의 과거 가격은 공개하지 않습니다. 아래 내용은 실제 작업 가격이 아닌 안내용 기준이며, 범위 확인 후 교체 가능한 정책 영역입니다.",
  priceItems: [
    { id: "price-bathroom", serviceKey: "bathroom", name: "화장실 청소", priceLabel: "현장 확인 후 범위 안내", conditions: ["공간 크기와 도기 수", "물때·곰팡이의 범위"], visible: true, sortOrder: 1 },
    { id: "price-aircon", serviceKey: "aircon", name: "에어컨 청소", priceLabel: "기기 형태별 안내", conditions: ["벽걸이·스탠드 등 기기 형태", "분해 가능한 범위"], visible: true, sortOrder: 2 },
    { id: "price-apartment-window", serviceKey: "apartment-window", name: "아파트 유리창 청소", priceLabel: "창 구조 확인 후 안내", conditions: ["창 개수와 구조", "내·외창 접근 가능 범위"], visible: true, sortOrder: 3 },
    { id: "price-commercial-window", serviceKey: "commercial-window", name: "상가 유리창 청소", priceLabel: "면적과 안전 조건 확인", conditions: ["전면 유리 면적", "외부 작업 높이"], visible: true, sortOrder: 4 },
  ],
  processSteps: [
    { id: "process-1", title: "요청 내용 확인", description: "필요한 서비스와 공간, 불편한 점을 먼저 확인합니다.", visible: true, sortOrder: 1 },
    { id: "process-2", title: "사진과 범위 확인", description: "재질과 오염 상태를 보고 작업 가능 범위를 나눕니다.", visible: true, sortOrder: 2 },
    { id: "process-3", title: "결과 안내", description: "작업한 범위와 관리 시 주의할 점을 정리해 안내합니다.", visible: true, sortOrder: 3 },
  ],
  about: { title: "보이는 결과와 확인 가능한 과정", description: "위생의 기술은 천안·아산을 중심으로 현장을 살피고 필요한 범위를 정직하게 안내합니다.", values: [{ id: "value-1", title: "필요한 범위부터", description: "과도한 약속보다 현장 상태와 가능한 작업 범위를 먼저 확인합니다." }, { id: "value-2", title: "과정이 남도록", description: "작업 전·과정·후 사진을 구분해 결과를 쉽게 비교합니다." }, { id: "value-3", title: "공개는 조심스럽게", description: "개인정보가 없는 자료만 공개합니다." }] },
  settings: { businessName: "위생의 기술", footerDescription: "천안·아산을 중심으로 현장을 살피고 필요한 범위를 정직하게 안내하는 청소 서비스입니다.", contactLabel: "작업 사례 보기", contactHref: "/portfolio" },
};
export const SITE_CONTENT_SEED_SNAPSHOT: SiteContentSnapshot = { draft: structuredClone(SITE_CONTENT_SEED), published: structuredClone(SITE_CONTENT_SEED), versions: [] };
