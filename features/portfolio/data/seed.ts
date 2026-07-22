import type {
  CaseMedia,
  CaseVideo,
  MockStoreEnvelope,
  PortfolioCase,
  PublishChecklist,
  Service,
  Tag,
} from "../model/types";

export const MOCK_ASSETS: Readonly<Record<string, string>> = Object.freeze({
  bathroom: "/mock-media/bathroom.svg",
  aircon: "/mock-media/aircon.svg",
  "apartment-window": "/mock-media/apartment-window.svg",
  "commercial-window": "/mock-media/commercial-window.svg",
});

const services: Service[] = [
  {
    id: "service-bathroom",
    key: "bathroom",
    name: "화장실 청소",
    slug: "bathroom",
    summary: "물때와 곰팡이, 틈새 오염까지 공간 상태에 맞춰 정리합니다.",
    description: "바닥·벽면·도기·수전의 재질과 오염 정도를 확인하고 필요한 범위를 구역별로 작업합니다.",
    coverAssetKey: "bathroom",
    sortOrder: 1,
    active: true,
  },
  {
    id: "service-aircon",
    key: "aircon",
    name: "에어컨 청소",
    slug: "aircon",
    summary: "분해 가능한 부품과 열교환기 상태를 확인해 꼼꼼하게 세척합니다.",
    description: "기기 형태와 설치 환경을 먼저 확인하고 오염이 다시 남지 않도록 세척과 건조 순서를 지킵니다.",
    coverAssetKey: "aircon",
    sortOrder: 2,
    active: true,
  },
  {
    id: "service-apartment-window",
    key: "apartment-window",
    name: "아파트 유리창 청소",
    slug: "apartment-window",
    summary: "창틀 먼지와 유리 얼룩을 함께 정리해 밝은 시야를 되찾습니다.",
    description: "세대 구조와 창호 상태, 안전한 접근 범위를 확인한 뒤 유리와 창틀을 순서대로 관리합니다.",
    coverAssetKey: "apartment-window",
    sortOrder: 3,
    active: true,
  },
  {
    id: "service-commercial-window",
    key: "commercial-window",
    name: "상가 유리창 청소",
    slug: "commercial-window",
    summary: "매장의 첫인상을 좌우하는 전면 유리와 프레임을 정돈합니다.",
    description: "영업 동선과 외부 환경을 고려해 작업 구역을 나누고 유리 자국과 프레임 오염을 관리합니다.",
    coverAssetKey: "commercial-window",
    sortOrder: 4,
    active: true,
  },
];

const completeChecklist: PublishChecklist = {
  noIdentifiablePeople: true,
  noVehiclePlates: true,
  noDetailedAddressOrContact: true,
  noPrivateDocumentsOrBelongings: true,
  publicMediaReviewed: true,
  requiredMetadataComplete: true,
  hasPublicReadyMedia: true,
};

const draftChecklist: PublishChecklist = {
  noIdentifiablePeople: false,
  noVehiclePlates: false,
  noDetailedAddressOrContact: false,
  noPrivateDocumentsOrBelongings: false,
  publicMediaReviewed: false,
  requiredMetadataComplete: true,
  hasPublicReadyMedia: false,
};

const variations = [
  { place: "천안 서북구", space: "아파트", label: "묵은 오염을 차분히 정리한 현장" },
  { place: "아산 배방읍", space: "주거 공간", label: "사용 흔적을 세심하게 관리한 현장" },
  { place: "천안 동남구", space: "소형 매장", label: "영업 전 깔끔하게 마무리한 현장" },
  { place: "아산 탕정면", space: "신축 공간", label: "입주 전 먼지와 얼룩을 정돈한 현장" },
  { place: "천안 불당동", space: "관리 현장", label: "공개 전 검토 중인 새 작업 기록" },
] as const;

function createCases(): PortfolioCase[] {
  return services.flatMap((service, serviceIndex) =>
    variations.map((variation, index) => {
      const published = index < 4;
      const day = serviceIndex * 5 + index + 1;
      const isoDay = String(day).padStart(2, "0");
      const timestamp = `2026-06-${isoDay}T09:00:00.000Z`;
      return {
        id: `case-${service.key}-${index + 1}`,
        serviceId: service.id,
        slug: `${service.key}-cheonan-asan-${index + 1}`,
        title: `${variation.label} · ${service.name}`,
        summary: `${variation.place}에서 현장 상태와 재질을 먼저 살피고 필요한 ${service.name} 범위를 정해 작업했습니다.`,
        locationDisplay: variation.place,
        spaceType: variation.space,
        workDate: `2026-06-${isoDay}`,
        displayPeriod: "2026년 6월",
        problemDescription: "일상 관리만으로 제거하기 어려운 먼지와 얼룩이 여러 구역에 남아 있었습니다.",
        workDescription: "오염과 재질을 구분한 뒤 도구를 달리해 작업하고, 각 구역을 다시 확인했습니다.",
        resultDescription: "과장된 표현 없이 작업 범위 안에서 눈에 띄는 오염을 정리하고 사용하기 편한 상태로 마쳤습니다.",
        status: published ? "published" : "private",
        featuredRank: index === 0 ? serviceIndex + 1 : null,
        privacyChecklist: published ? completeChecklist : draftChecklist,
        publishedAt: published ? timestamp : null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }),
  );
}

function createMedia(cases: PortfolioCase[]): CaseMedia[] {
  return cases.flatMap((portfolioCase) => {
    const service = services.find(({ id }) => id === portfolioCase.serviceId)!;
    const stages = portfolioCase.status === "published"
      ? (["before", "process", "after", "detail"] as const)
      : (["before", "after"] as const);

    return stages.map((stage, index) => ({
      id: `media-${portfolioCase.id}-${stage}`,
      caseId: portfolioCase.id,
      stage,
      sortOrder: index,
      cover: index === 2 && portfolioCase.status === "published",
      public: portfolioCase.status === "published" && index < 3,
      altText: `${portfolioCase.title}의 ${stage === "before" ? "작업 전" : stage === "process" ? "작업 과정" : stage === "after" ? "작업 후" : "세부"} 모습`,
      caption: stage === "before" ? "작업 전 상태" : stage === "process" ? "구역별 작업 과정" : stage === "after" ? "작업을 마친 모습" : "공개하지 않은 세부 기록",
      width: 1600,
      height: 1200,
      mimeType: "image/jpeg",
      sizeBytes: 420_000 + index * 10_000,
      uploadStatus: "ready",
      mockAssetKey: service.key,
      sessionPreviewId: null,
    }));
  });
}

function createTags(): Tag[] {
  const definitions = [
    ["home", "주거", "space"],
    ["heavy-soil", "묵은 오염", "contamination"],
    ["full-clean", "전체 관리", "scope"],
  ] as const;
  return services.flatMap((service) =>
    definitions.map(([key, name, type], index) => ({
      id: `tag-${service.key}-${key}`,
      serviceId: service.id,
      key,
      name,
      type,
      sortOrder: index + 1,
      active: true,
    })),
  );
}

function createVideos(cases: PortfolioCase[]): CaseVideo[] {
  return cases.slice(0, 5).map((portfolioCase, index) => ({
    id: `video-${portfolioCase.id}`,
    caseId: portfolioCase.id,
    youtubeVideoId: `cleaning0${index + 1}`.padEnd(11, "x"),
    originalUrl: `https://youtu.be/${`cleaning0${index + 1}`.padEnd(11, "x")}`,
    title: `${portfolioCase.title} 작업 영상`,
    caption: "현장 흐름을 확인하는 목업 영상 항목입니다.",
    sortOrder: 0,
    public: index < 4,
  }));
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

const cases = createCases();
const tags = createTags();

export const SEED_SNAPSHOT: Readonly<MockStoreEnvelope> = deepFreeze({
  schemaVersion: 1,
  savedAt: "2026-07-22T00:00:00.000Z",
  services,
  cases,
  media: createMedia(cases),
  videos: createVideos(cases),
  tags,
  caseTagIds: Object.fromEntries(
    cases.map((portfolioCase) => {
      const service = services.find(({ id }) => id === portfolioCase.serviceId)!;
      return [
        portfolioCase.id,
        [
          `tag-${service.key}-home`,
          `tag-${service.key}-${portfolioCase.status === "published" ? "full-clean" : "heavy-soil"}`,
        ],
      ];
    }),
  ),
});

