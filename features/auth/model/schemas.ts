import { z } from "zod";
export const CustomerCredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("올바른 이메일 주소를 입력해 주세요."),
  password: z.string().min(12, "비밀번호는 12자 이상이어야 합니다.").regex(/[A-Za-z]/, "영문을 포함해 주세요.").regex(/[0-9]/, "숫자를 포함해 주세요."),
});
