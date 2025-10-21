import { z } from "zod";

export const profileUpdateSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(20, "닉네임은 20자 이하여야 합니다"),
  region: z
    .string()
    .max(50, "거래지역은 50자 이하여야 합니다")
    .optional()
    .or(z.literal("")),
  introShort: z
    .string()
    .max(50, "한 줄 소개는 50자 이하여야 합니다")
    .optional()
    .or(z.literal("")),
  introLong: z
    .string()
    .max(500, "자기소개는 500자 이하여야 합니다")
    .optional()
    .or(z.literal("")),
});

export const avatarUploadSchema = z.object({
  file: z.instanceof(File, { message: "파일을 선택해주세요" }),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;
