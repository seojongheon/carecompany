import { z } from "zod";

const CursorSchema = z.object({
  featuredRank: z.number().int().positive().nullable(),
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  id: z.string().min(1),
});

export type PortfolioCursor = z.infer<typeof CursorSchema>;

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodePortfolioCursor(cursor: PortfolioCursor) {
  return toBase64Url(JSON.stringify(CursorSchema.parse(cursor)));
}

export function decodePortfolioCursor(value: string): PortfolioCursor | null {
  try {
    return CursorSchema.parse(JSON.parse(fromBase64Url(value)));
  } catch {
    return null;
  }
}

