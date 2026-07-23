export type AuthRole = "customer" | "admin" | "super_admin";
export interface AuthCredentials { email: string; password: string; }
export interface AuthSession { userId?: string; email: string; role: AuthRole; isActive?: boolean; expiresAt: string; }
export type AuthResult = { ok: true } | { ok: false; message: string };
export interface AuthRepository {
  getSession(): AuthSession | null;
  subscribe(listener: () => void): () => void;
  signUpCustomer(input: AuthCredentials): Promise<AuthResult>;
  signInCustomer(input: AuthCredentials): Promise<AuthResult>;
  signInAdmin(input: AuthCredentials): Promise<AuthResult>;
  requestPasswordReset(email: string): Promise<{ ok: true; message: string }>;
  signOut(): void | Promise<void>;
}
