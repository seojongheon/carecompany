import type { MockStoreEnvelope, PublishIssueCode } from "@/features/portfolio/model/types";

export interface PublishCheck { key: string; label: string; complete: boolean; issueCode?: PublishIssueCode }

export function getPublishChecks(store: MockStoreEnvelope, caseId: string): PublishCheck[] {
  const item = store.cases.find(({ id }) => id === caseId);
  if (!item) return [];
  const media = store.media.filter(({ caseId: owner }) => owner === caseId);
  return [
    { key: "metadata", label: "제목·서비스·표시 지역이 입력됨", complete: Boolean(item.title && item.serviceId && item.locationDisplay), issueCode: "missing-title" },
    {
      key: "media",
      label: "공개 가능한 대표 사진과 사진이 준비됨",
      complete: media.some((entry) => entry.cover && entry.public && entry.uploadStatus === "ready")
        && media.some((entry) => entry.public && entry.uploadStatus === "ready"),
      issueCode: "missing-cover",
    },
    { key: "noIdentifiablePeople", label: "식별 가능한 사람이 없음", complete: item.privacyChecklist.noIdentifiablePeople },
    { key: "noVehiclePlates", label: "차량 번호판이 없음", complete: item.privacyChecklist.noVehiclePlates },
    { key: "noDetailedAddressOrContact", label: "상세 주소·연락처가 없음", complete: item.privacyChecklist.noDetailedAddressOrContact },
    { key: "noPrivateDocumentsOrBelongings", label: "개인 문서·소지품이 없음", complete: item.privacyChecklist.noPrivateDocumentsOrBelongings },
    { key: "publicMediaReviewed", label: "공개 사진을 최종 검토함", complete: item.privacyChecklist.publicMediaReviewed },
  ];
}
