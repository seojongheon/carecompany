"use client";

import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import { MOCK_ASSETS } from "@/features/portfolio/data/seed";
import type { CaseMedia } from "@/features/portfolio/model/types";
import { MediaStageBadge } from "./media-stage-badge";

type StageSlide = {
  src: string;
  stage: CaseMedia["stage"];
};

export function CaseLightbox({ media, index, onClose, urls = {} }: { media: CaseMedia[]; index: number; onClose(): void; urls?: Record<string, string> }) {
  return <Lightbox open={index >= 0} close={onClose} index={Math.max(0, index)} plugins={[Captions, Zoom]} slides={media.map((item) => ({ src: urls[item.id] ?? MOCK_ASSETS[item.mockAssetKey], alt: item.altText, title: item.caption, description: item.altText, width: item.width, height: item.height, stage: item.stage }))} render={{ slideHeader: ({ slide }) => <MediaStageBadge stage={(slide as StageSlide).stage} className="right-4 top-20" testId="case-lightbox-stage-badge" /> }} carousel={{ finite: true }} controller={{ closeOnBackdropClick: true }} />;
}
