export type OperationResult<T = undefined> = { ok: true; data: T } | { ok: false; message: string };
export function operationError(error: unknown): string {
  if (error instanceof Error && /권한|충돌|다시|필수|확인/.test(error.message)) return error.message;
  return "작업을 완료하지 못했습니다. 입력 내용과 연결 상태를 확인하고 다시 시도해 주세요.";
}
