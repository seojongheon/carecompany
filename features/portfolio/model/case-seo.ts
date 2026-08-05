import type { PublicCaseDetail } from "./types";

const DRAFT_PLACEHOLDERS = new Set([
  "새 작업 사례의 설명을 입력해 주세요.",
  "작업 전 상태를 입력해 주세요.",
  "작업 내용을 입력해 주세요.",
  "작업 결과를 입력해 주세요.",
]);

function normalize(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function usable(value: string | undefined) {
  const normalized = normalize(value);
  return normalized && !DRAFT_PLACEHOLDERS.has(normalized) ? normalized : "";
}

function withoutTerminalPunctuation(value: string) {
  return value.replace(/[.!?。]+$/u, "");
}

function sentence(label: string, value: string) {
  return `${label} ${withoutTerminalPunctuation(value)}.`;
}

export function buildCaseSeo(detail: PublicCaseDetail) {
  const location = usable(detail.locationDisplay);
  const serviceName = usable(detail.service.name);
  const caseTitle = usable(detail.title);
  const spaceType = usable(detail.spaceType);
  const title = [location, serviceName, "작업 사례"].filter(Boolean).join(" ")
    + (caseTitle ? ` - ${caseTitle}` : "");

  const introduction = [location, spaceType, serviceName, "작업 사례입니다."].filter(Boolean).join(" ");
  const narratives = [
    ["작업 전에는", usable(detail.problemDescription)],
    ["진행한 작업은", usable(detail.workDescription)],
    ["작업 결과는", usable(detail.resultDescription)],
  ] as const;
  const narrativeSentences = narratives
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => sentence(label, value));
  const fallback = usable(detail.summary)
    || (caseTitle ? `${caseTitle}의 현장 상태와 작업 내용을 확인할 수 있습니다.` : "");

  return {
    title: title || caseTitle || serviceName,
    description: [introduction, ...(narrativeSentences.length ? narrativeSentences : [fallback])]
      .filter(Boolean)
      .join(" "),
  };
}
