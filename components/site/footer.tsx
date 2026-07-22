import Link from "next/link";

export function Footer() {
  return <footer className="mt-24 border-t border-[var(--neutral-200)] bg-[var(--neutral-900)] text-white"><div className="page-shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]"><div><p className="text-xl font-black">위생의 기술</p><p className="mt-3 max-w-md text-sm text-white/65">천안·아산을 중심으로 현장을 살피고 필요한 범위를 정직하게 안내하는 청소 서비스입니다.</p></div><nav aria-label="하단 서비스"><p className="mb-3 font-bold">서비스</p><Link className="footer-link" href="/services">서비스 전체</Link><Link className="footer-link" href="/portfolio">작업 사례</Link><Link className="footer-link" href="/pricing">가격 안내</Link></nav><nav aria-label="하단 안내"><p className="mb-3 font-bold">안내</p><Link className="footer-link" href="/process">작업 과정</Link><Link className="footer-link" href="/about">업체 소개</Link><Link className="footer-link" href="/privacy">개인정보처리방침</Link><Link className="footer-link" href="/admin">관리자 목업</Link></nav></div><div className="border-t border-white/10"><div className="page-shell py-5 text-xs text-white/50">© 2026 위생의 기술 · 연락처와 사업자 정보는 배포 전 실제 정보로 교체합니다.</div></div></footer>;
}

