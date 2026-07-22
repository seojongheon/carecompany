import { EstimateFab } from "@/components/site/estimate-fab";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export default function SiteLayout({ children, modal }: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return <><Header />{children}<Footer /><EstimateFab />{modal}</>;
}

