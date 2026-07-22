import type { Metadata } from "next";
import { PortfolioProvider } from "@/features/portfolio/repository/portfolio-provider";
import { SiteContentProvider } from "@/features/site-content/repository/site-content-provider";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/features/auth/repository/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "위생의 기술 | 천안·아산 청소 포트폴리오",
    template: "%s | 위생의 기술",
  },
  description: "화장실, 에어컨, 아파트 유리창, 상가 유리창 청소의 실제 작업 사례를 확인하세요.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "위생의 기술 | 천안·아산 청소 포트폴리오",
    description: "화장실, 에어컨, 아파트 유리창, 상가 유리창 청소의 공개 작업 사례",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
        <ToastProvider>
          <AuthProvider><SiteContentProvider><PortfolioProvider>{children}</PortfolioProvider></SiteContentProvider></AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
