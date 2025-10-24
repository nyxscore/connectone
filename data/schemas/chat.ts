import { z } from "zod";

export const messageTypeSchema = z.enum(["text", "image", "file"]);

export const messageCreateSchema = z.object({
  chatId: z.string().min(1),
  content: z.string().min(1, "메시지를 입력해주세요"),
  type: messageTypeSchema.default("text"),
});

export const chatRoomCreateSchema = z.object({
  productId: z.string().min(1),
  buyerId: z.string().min(1),
  sellerId: z.string().min(1),
});

export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type ChatRoomCreateInput = z.infer<typeof chatRoomCreateSchema>;
export type MessageType = z.infer<typeof messageTypeSchema>;












































