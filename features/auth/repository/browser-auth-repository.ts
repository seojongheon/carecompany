import { CustomerCredentialsSchema } from "../model/schemas";
import type { AuthCredentials, AuthRepository, AuthResult, AuthSession } from "../model/types";

export const AUTH_ACCOUNTS_KEY = "hygiene-technology:mock-customer-accounts:v1";
export const AUTH_SESSION_KEY = "hygiene-technology:mock-auth-session:v1";
type StoredAccount = { email: string; salt: string; digest: string; createdAt: string };
const genericError = "이메일 또는 비밀번호를 확인해 주세요.";
const encode = (bytes: Uint8Array) => Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
async function digest(password: string, salt: string) { const data = new TextEncoder().encode(`${salt}:${password}`); return encode(new Uint8Array(await crypto.subtle.digest("SHA-256", data))); }

export class BrowserAuthRepository implements AuthRepository {
  private listeners = new Set<() => void>();
  constructor(private readonly storage: Storage) {}
  getSession(): AuthSession | null { try { const raw = this.storage.getItem(AUTH_SESSION_KEY); if (!raw) return null; const session = JSON.parse(raw) as AuthSession; if (session.role !== "customer" || !session.email || new Date(session.expiresAt).getTime() <= Date.now()) { this.storage.removeItem(AUTH_SESSION_KEY); return null; } return session; } catch { this.storage.removeItem(AUTH_SESSION_KEY); return null; } }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  async signUpCustomer(input: AuthCredentials): Promise<AuthResult> { const parsed = CustomerCredentialsSchema.safeParse(input); if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? genericError }; const accounts = this.accounts(); if (accounts.some(({ email }) => email === parsed.data.email)) return { ok: false, message: "이미 가입된 이메일입니다." }; const saltBytes = crypto.getRandomValues(new Uint8Array(16)); const account = { email: parsed.data.email, salt: encode(saltBytes), digest: await digest(parsed.data.password, encode(saltBytes)), createdAt: new Date().toISOString() }; this.storage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify([...accounts, account])); this.createCustomerSession(account.email); return { ok: true }; }
  async signInCustomer(input: AuthCredentials): Promise<AuthResult> { const email = input.email.trim().toLowerCase(); const account = this.accounts().find((item) => item.email === email); if (!account || await digest(input.password, account.salt) !== account.digest) return { ok: false, message: genericError }; this.createCustomerSession(email); return { ok: true }; }
  async signInAdmin(input: AuthCredentials): Promise<AuthResult> { void input; return { ok: false, message: "관리자 인증은 Supabase 연동 후 사용할 수 있습니다." }; }
  async requestPasswordReset(): Promise<{ ok: true; message: string }> { return { ok: true, message: "계정이 존재하면 비밀번호 재설정 안내를 보내드립니다." }; }
  signOut() { this.storage.removeItem(AUTH_SESSION_KEY); this.emit(); }
  private accounts(): StoredAccount[] { try { return JSON.parse(this.storage.getItem(AUTH_ACCOUNTS_KEY) ?? "[]") as StoredAccount[]; } catch { return []; } }
  private createCustomerSession(email: string) { const session: AuthSession = { email, role: "customer", expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() }; this.storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session)); this.emit(); }
  private emit() { this.listeners.forEach((listener) => listener()); }
}
