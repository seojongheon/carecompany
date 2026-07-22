export function StickySectionTabs({ items }: { items: Array<{ href: string; label: string }> }) {
  return <nav aria-label="페이지 내 이동" className="sticky top-18 z-20 border-b border-[var(--neutral-200)] bg-white"><div className="page-shell flex min-h-12 gap-5 overflow-x-auto">{items.map((item) => <a className="section-tab" href={item.href} key={item.href}>{item.label}</a>)}</div></nav>;
}

