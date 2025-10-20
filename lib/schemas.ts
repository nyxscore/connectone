import { z } from "zod";

export const signUpSchema = z
  .object({
    username: z
      .string()
      .min(4, "아이디는 4자 이상이어야 합니다.")
      .max(20, "아이디는 20자 이하여야 합니다.")
      .regex(/^[a-zA-Z0-9]+$/, "아이디는 영어와 숫자만 사용 가능합니다."),
    email: z
      .string()
      .min(1, "이메일을 입력해주세요.")
      .email("올바른 이메일 형식이 아닙니다."),
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상이어야 합니다.")
      .max(100, "비밀번호는 100자 이하여야 합니다.")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).+$/,
        "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다."
      ),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요."),
    nickname: z
      .string()
      .min(2, "닉네임은 2자 이상이어야 합니다.")
      .max(20, "닉네임은 20자 이하여야 합니다.")
      .regex(
        /^[가-힣a-zA-Z0-9]+$/,
        "닉네임은 한글, 영문, 숫자만 사용 가능합니다."
      ),
    region: z.string().min(1, "지역을 선택해주세요."),
    agreeTerms: z.boolean().refine(val => val === true, "약관에 동의해주세요."),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "아이디를 입력해주세요.")
    .min(4, "아이디는 4자 이상이어야 합니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const sellItemSchema = z.object({
  brand: z.string().min(1, "브랜드를 입력해주세요."),
  model: z.string().min(1, "모델명을 입력해주세요."),
  year: z
    .number()
    .min(1900, "올바른 연도를 입력해주세요.")
    .max(new Date().getFullYear(), "미래 연도는 입력할 수 없습니다."),
  condition: z.enum(["A", "B", "C", "D", "E"], {
    required_error: "상태를 선택해주세요.",
  }),
  category: z.string().min(1, "카테고리를 선택해주세요."),
  region: z.string().min(1, "지역을 입력해주세요."),
  price: z.number().min(0, "가격은 0원 이상이어야 합니다."),
  description: z.string().min(10, "상품 설명은 10자 이상 입력해주세요."),
  shippingType: z.enum(["direct", "courier", "pickup"], {
    required_error: "배송 방법을 선택해주세요.",
  }),
  escrowEnabled: z.boolean().default(false),
});

export const shippingAddressSchema = z.object({
  recipientName: z.string().min(1, "받는 사람 이름을 입력해주세요."),
  phoneNumber: z
    .string()
    .min(1, "연락처를 입력해주세요.")
    .regex(
      /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/,
      "올바른 연락처 형식을 입력해주세요."
    ),
  address: z.string().min(10, "상세 주소를 입력해주세요."),
  zipCode: z.string().min(5, "우편번호를 입력해주세요."),
  deliveryMemo: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SellItemInput = z.infer<typeof sellItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
