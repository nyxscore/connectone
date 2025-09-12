import { z } from "zod";

export const profileUpdateSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(20, "닉네임은 20자 이하여야 합니다"),
  region: z.string().min(1, "지역을 선택해주세요"),
  introShort: z
    .string()
    .max(50, "한 줄 소개는 50자 이하여야 합니다")
    .optional(),
  introLong: z.string().max(500, "자기소개는 500자 이하여야 합니다").optional(),
});

export const avatarUploadSchema = z.object({
  file: z.instanceof(File, "파일을 선택해주세요"),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;
