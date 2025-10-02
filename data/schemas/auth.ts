import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

export const signupSchema = z
  .object({
    email: z.string().email("유효한 이메일을 입력해주세요"),
    password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
    confirmPassword: z.string(),
    nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다"),
    region: z.string().min(1, "지역을 선택해주세요"),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

export const profileUpdateSchema = z.object({
  nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다"),
  region: z.string().min(1, "지역을 선택해주세요"),
  profileImage: z.string().url().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;















