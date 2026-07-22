"use client";

import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import { MOCK_ASSETS } from "@/features/portfolio/data/seed";
import type { CaseMedia } from "@/features/portfolio/model/types";

export function CaseLightbox({ media, index, onClose }: { media: CaseMedia[]; index: number; onClose(): void }) {
  return <Lightbox open={index >= 0} close={onClose} index={Math.max(0, index)} plugins={[Captions, Zoom]} slides={media.map((item) => ({ src: MOCK_ASSETS[item.mockAssetKey], alt: item.altText, title: item.caption, description: item.altText, width: item.width, height: item.height }))} carousel={{ finite: true }} controller={{ closeOnBackdropClick: true }} />;
}

