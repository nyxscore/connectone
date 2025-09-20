import { z } from "zod";

export const instrumentCategorySchema = z.enum([
  "건반",
  "현악",
  "관악",
  "타악",
  "국악",
  "음향",
  "특수",
  "용품",
]);

export const conditionGradeSchema = z.enum(["A", "B", "C", "D"]);

export const shippingTypeSchema = z.enum(["direct", "pickup", "courier"]);

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
  title: z.string().min(1, "상품명을 입력해주세요"),
  condition: conditionGradeSchema,
  price: z.number().min(0, "가격은 0원 이상이어야 합니다"),
  region: z.string().min(1, "거래 지역을 입력해주세요"),
  description: z.string().min(10, "상품 설명을 10자 이상 입력해주세요"),
  images: z.array(z.string()).optional().default([]),
  escrowEnabled: z.boolean().default(true),
  shippingTypes: z
    .array(shippingTypeSchema)
    .min(1, "최소 1개의 배송 방법을 선택해주세요"),
});

// 상품 상세 페이지용 스키마
export const tradeOptionSchema = z.enum([
  "직거래",
  "택배",
  "화물운송",
  "안전거래",
]);

export const productDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  category: instrumentCategorySchema,
  region: z.string(),
  tradeOptions: z.array(tradeOptionSchema),
  sellerId: z.string(),
  description: z.string(),
  images: z.array(z.string()).optional().default([]),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export const sellerInfoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  grade: z.enum(["Bronze", "Silver", "Gold"]),
  phoneVerified: z.boolean(),
  idVerified: z.boolean(),
  bankVerified: z.boolean(),
});

export type SellItemInput = z.infer<typeof sellItemSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type InstrumentCategory = z.infer<typeof instrumentCategorySchema>;
export type ConditionGrade = z.infer<typeof conditionGradeSchema>;
export type ShippingType = z.infer<typeof shippingTypeSchema>;
export type TradeOption = z.infer<typeof tradeOptionSchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type SellerInfo = z.infer<typeof sellerInfoSchema>;
