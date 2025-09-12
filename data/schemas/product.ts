import { z } from "zod";

export const instrumentCategorySchema = z.enum([
  "건반",
  "현악",
  "관악",
  "타악",
  "전자",
  "특수",
  "주변기기",
]);

export const conditionGradeSchema = z.enum(["A", "B", "C", "D"]);

export const shippingTypeSchema = z.enum(["meetup", "cargo", "courier"]);

export const productCreateSchema = z.object({
  title: z.string().min(1, "상품명을 입력해주세요"),
  description: z.string().min(10, "상품 설명을 10자 이상 입력해주세요"),
  category: instrumentCategorySchema,
  brand: z.string().min(1, "브랜드를 입력해주세요"),
  model: z.string().min(1, "모델명을 입력해주세요"),
  year: z.number().min(1900).max(new Date().getFullYear()),
  condition: conditionGradeSchema,
  price: z.number().min(0, "가격은 0원 이상이어야 합니다"),
  region: z.string().min(1, "거래 지역을 입력해주세요"),
  isEscrow: z.boolean().default(true),
  isShipping: z.boolean().default(false),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productSearchSchema = z.object({
  keyword: z.string().optional(),
  category: instrumentCategorySchema.optional(),
  condition: z.array(conditionGradeSchema).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  region: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

// 판매글 등록 스키마
export const sellItemSchema = z.object({
  category: instrumentCategorySchema,
  brand: z.string().min(1, "브랜드를 입력해주세요"),
  model: z.string().min(1, "모델명을 입력해주세요"),
  year: z
    .number()
    .min(1900)
    .max(new Date().getFullYear(), "올바른 연식을 입력해주세요"),
  condition: conditionGradeSchema,
  price: z.number().min(0, "가격은 0원 이상이어야 합니다"),
  region: z.string().min(1, "거래 지역을 입력해주세요"),
  description: z.string().min(10, "상품 설명을 10자 이상 입력해주세요"),
  images: z.array(z.string()).min(1, "최소 1장의 이미지가 필요합니다"),
  escrowEnabled: z.boolean().default(true),
  shippingType: shippingTypeSchema,
});

export type SellItemInput = z.infer<typeof sellItemSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type InstrumentCategory = z.infer<typeof instrumentCategorySchema>;
export type ConditionGrade = z.infer<typeof conditionGradeSchema>;
export type ShippingType = z.infer<typeof shippingTypeSchema>;
