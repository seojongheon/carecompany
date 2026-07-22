import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "개인정보처리방침", description: "프런트엔드 목업의 데이터 처리 범위와 실제 배포 전 교체 사항을 안내합니다.", path: "/privacy" });

export default function PrivacyPage() {
  return <main id="main-content" className="page-shell max-w-3xl py-16"><span className="eyebrow">PRIVACY</span><h1 className="page-title">개인정보처리방침</h1><p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">현재 사이트는 프런트엔드 기능 검증용 목업이며 문의·회원가입·분석 수집을 수행하지 않습니다. 실제 배포 전 법률 검토를 거친 사업자 정보와 처리방침으로 교체해야 합니다.</p><div className="prose-copy"><h2>현재 처리하는 정보</h2><p>이 목업은 서버로 개인정보를 전송하지 않습니다. 관리자 입력 데이터는 현재 브라우저의 localStorage에만 저장됩니다.</p><h2>선택한 사진</h2><p>사용자가 선택한 파일은 현재 탭의 미리보기 object URL로만 사용하며 새로고침 뒤에는 복원하지 않습니다.</p><h2>실제 서비스 전환 시</h2><p>문의 정보, 접속 기록, 원격 저장 파일의 목적·보유 기간·파기·위탁·권리 행사 방법과 안전성 조치를 확정하고 본 문서를 교체해야 합니다.</p></div></main>;
}
