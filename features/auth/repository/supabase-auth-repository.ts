import { CustomerCredentialsSchema } from "../model/schemas";
import type { AuthCredentials, AuthRepository, AuthResult, AuthRole, AuthSession } from "../model/types";

const genericCredentialError = "이메일 또는 비밀번호를 확인해 주세요.";
const genericRecoveryMessage = "계정이 존재하면 비밀번호 재설정 안내를 보내드립니다.";

export interface AuthProfileRow {
  id: string;
  email: string;
  role: AuthRole;
  is_active: boolean;
}

interface AuthUser {
  id: string;
  email?: string | null;
}

interface ProviderSession {
  expires_at?: number;
  user?: AuthUser;
}

interface AuthClientLike {
  auth: {
    getSession(): Promise<{ data: { session: ProviderSession | null }; error: unknown }>;
    signUp(input: { email: string; password: string; options?: { emailRedirectTo?: string } }): Promise<{ data: { user: AuthUser | null; session: ProviderSession | null }; error: unknown }>;
    signInWithPassword(input: { email: string; password: string }): Promise<{ data: { user: AuthUser | null; session: ProviderSession | null }; error: unknown }>;
    resetPasswordForEmail(email: string, options: { redirectTo: string }): Promise<unknown>;
    signOut(): Promise<unknown>;
    onAuthStateChange(callback: (event: string, session: ProviderSession | null) => void): { data: { subscription: { unsubscribe(): void } } };
  };
}

type ProfileLoader = (userId: string) => Promise<AuthProfileRow | null>;

export class SupabaseAuthRepository implements AuthRepository {
  private session: AuthSession | null = null;
  private readonly listeners = new Set<() => void>();
  private subscription: { unsubscribe(): void } | null = null;

  constructor(
    private readonly client: AuthClientLike,
    private readonly loadProfile: ProfileLoader,
    private readonly getOrigin: () => string = () => globalThis.location?.origin ?? "http://localhost:3000",
  ) {}

  getSession() {
    return this.session;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async initialize() {
    const { data } = await this.client.auth.getSession();
    await this.acceptProviderSession(data.session);
    this.subscription ??= this.client.auth.onAuthStateChange((_event, session) => {
      void this.acceptProviderSession(session);
    }).data.subscription;
  }

  async signUpCustomer(input: AuthCredentials): Promise<AuthResult> {
    const parsed = CustomerCredentialsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? genericCredentialError };
    }
    const email = parsed.data.email.trim().toLowerCase();
    const { data, error } = await this.client.auth.signUp({
      email,
      password: parsed.data.password,
      options: { emailRedirectTo: `${this.getOrigin()}/auth/callback?next=/account` },
    });
    if (error) return { ok: false, message: genericCredentialError };
    if (data.session) await this.acceptProviderSession({ ...data.session, user: data.user ?? data.session.user });
    return { ok: true };
  }

  async signInCustomer(input: AuthCredentials): Promise<AuthResult> {
    return this.signIn(input, false);
  }

  async signInAdmin(input: AuthCredentials): Promise<AuthResult> {
    return this.signIn(input, true);
  }

  async requestPasswordReset(email: string) {
    await this.client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${this.getOrigin()}/auth/callback?next=/auth/update-password`,
    });
    return { ok: true as const, message: genericRecoveryMessage };
  }

  async signOut() {
    await this.client.auth.signOut();
    this.setSession(null);
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private async signIn(input: AuthCredentials, requireAdmin: boolean): Promise<AuthResult> {
    const parsed = CustomerCredentialsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: genericCredentialError };
    const { data, error } = await this.client.auth.signInWithPassword({
      email: parsed.data.email.trim().toLowerCase(),
      password: parsed.data.password,
    });
    if (error || !data.user || !data.session) {
      this.setSession(null);
      return { ok: false, message: genericCredentialError };
    }
    await this.acceptProviderSession({ ...data.session, user: data.user });
    if (requireAdmin && (!this.session?.isActive || !["admin", "super_admin"].includes(this.session.role))) {
      await this.client.auth.signOut();
      this.setSession(null);
      return { ok: false, message: genericCredentialError };
    }
    return this.session ? { ok: true } : { ok: false, message: genericCredentialError };
  }

  private async acceptProviderSession(providerSession: ProviderSession | null) {
    const user = providerSession?.user;
    if (!user?.id) {
      this.setSession(null);
      return;
    }
    const profile = await this.loadProfile(user.id);
    if (!profile) {
      this.setSession(null);
      return;
    }
    this.setSession({
      userId: profile.id,
      email: profile.email || user.email || "",
      role: profile.role,
      isActive: profile.is_active,
      expiresAt: new Date((providerSession?.expires_at ?? Math.floor(Date.now() / 1000) + 3600) * 1000).toISOString(),
    });
  }

  private setSession(session: AuthSession | null) {
    this.session = session;
    this.listeners.forEach((listener) => listener());
  }
}
