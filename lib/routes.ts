import type { ServiceKey } from "@/features/portfolio/model/types";

export function servicePath(service: ServiceKey) {
  return `/services/${service}` as const;
}

export function portfolioPath(slug: string) {
  return `/portfolio/${encodeURIComponent(slug)}` as const;
}

export function withPortfolioQuery(
  base: string,
  values: Record<string, string | string[] | undefined | null>,
) {
  const params = new URLSearchParams();
  for (const key of Object.keys(values).sort()) {
    const value = values[key];
    if (Array.isArray(value)) {
      if (value.length) params.set(key, [...value].sort().join(","));
    } else if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

