import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/AuthContext";
import SignupPage from "@/app/auth/signup/page";
import LoginPage from "@/app/auth/login/page";
import SellPage from "@/app/sell/page";
import ListPage from "@/app/list/page";

// Mock data
const mockUser = {
  uid: "user123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
};

const mockProduct = {
  id: "prod123",
  title: "Fender Stratocaster 2020",
  category: "string",
  brand: "Fender",
  model: "Stratocaster",
  year: 2020,
  condition: "A",
  price: 1500000,
  region: "서울시 강남구",
  description: "상태 좋은 기타입니다.",
  images: ["https://example.com/guitar1.jpg"],
  sellerId: "user123",
  sellerName: "Test User",
  createdAt: new Date(),
  updatedAt: new Date(),
  status: "active",
  viewCount: 0,
  likeCount: 0,
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe("E2E 시나리오 1: 회원가입/로그인 → 매물 등록 → 리스트 노출", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1.1 회원가입", () => {
    it("사용자가 회원가입을 완료할 수 있다", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>
      );

      // 이메일 입력
      const emailInput = screen.getByLabelText(/이메일/i);
      await user.type(emailInput, "test@example.com");

      // 비밀번호 입력
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      await user.type(passwordInput, "password123");

      // 닉네임 입력
      const nicknameInput = screen.getByLabelText(/닉네임/i);
      await user.type(nicknameInput, "Test User");

      // 지역 선택
      const regionSelect = screen.getByLabelText(/지역/i);
      await user.selectOptions(regionSelect, "서울시 강남구");

      // 약관 동의
      const termsCheckbox = screen.getByLabelText(/약관에 동의/i);
      await user.click(termsCheckbox);

      // 회원가입 버튼 클릭
      const signupButton = screen.getByRole("button", { name: /회원가입/i });
      await user.click(signupButton);

      // 성공 메시지 확인
      await waitFor(() => {
        expect(
          screen.getByText(/회원가입이 완료되었습니다/i)
        ).toBeInTheDocument();
      });
    });

    it("필수 필드가 누락되면 에러 메시지를 표시한다", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>
      );

      // 회원가입 버튼 클릭 (필수 필드 없이)
      const signupButton = screen.getByRole("button", { name: /회원가입/i });
      await user.click(signupButton);

      // 에러 메시지 확인
      expect(screen.getByText(/이메일을 입력해주세요/i)).toBeInTheDocument();
      expect(screen.getByText(/비밀번호를 입력해주세요/i)).toBeInTheDocument();
    });
  });

  describe("1.2 로그인", () => {
    it("사용자가 로그인할 수 있다", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // 이메일 입력
      const emailInput = screen.getByLabelText(/이메일/i);
      await user.type(emailInput, "test@example.com");

      // 비밀번호 입력
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      await user.type(passwordInput, "password123");

      // 로그인 버튼 클릭
      const loginButton = screen.getByRole("button", { name: /로그인/i });
      await user.click(loginButton);

      // 성공적으로 로그인되었는지 확인
      await waitFor(() => {
        expect(screen.getByText(/로그인되었습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe("1.3 매물 등록", () => {
    it("로그인된 사용자가 매물을 등록할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      render(
        <TestWrapper>
          <SellPage />
        </TestWrapper>
      );

      // 제목 입력
      const titleInput = screen.getByLabelText(/제목/i);
      await user.type(titleInput, "Fender Stratocaster 2020");

      // 카테고리 선택
      const categorySelect = screen.getByLabelText(/카테고리/i);
      await user.selectOptions(categorySelect, "string");

      // 브랜드 입력
      const brandInput = screen.getByLabelText(/브랜드/i);
      await user.type(brandInput, "Fender");

      // 모델 입력
      const modelInput = screen.getByLabelText(/모델/i);
      await user.type(modelInput, "Stratocaster");

      // 연도 입력
      const yearInput = screen.getByLabelText(/연도/i);
      await user.type(yearInput, "2020");

      // 상태 선택
      const conditionSelect = screen.getByLabelText(/상태/i);
      await user.selectOptions(conditionSelect, "A");

      // 가격 입력
      const priceInput = screen.getByLabelText(/가격/i);
      await user.type(priceInput, "1500000");

      // 지역 선택
      const regionSelect = screen.getByLabelText(/거래 지역/i);
      await user.selectOptions(regionSelect, "서울시 강남구");

      // 설명 입력
      const descriptionTextarea = screen.getByLabelText(/상품 설명/i);
      await user.type(descriptionTextarea, "상태 좋은 기타입니다.");

      // 이미지 업로드 (Mock)
      const fileInput = screen.getByLabelText(/이미지 업로드/i);
      const file = new File(["test"], "guitar.jpg", { type: "image/jpeg" });
      await user.upload(fileInput, file);

      // 등록 버튼 클릭
      const submitButton = screen.getByRole("button", { name: /등록하기/i });
      await user.click(submitButton);

      // 성공 메시지 확인
      await waitFor(() => {
        expect(screen.getByText(/상품이 등록되었습니다/i)).toBeInTheDocument();
      });
    });

    it("모바일 카메라 촬영 기능이 작동한다", async () => {
      const user = userEvent.setup();

      // Mock getUserMedia for camera access
      Object.defineProperty(navigator, "mediaDevices", {
        writable: true,
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }],
          }),
        },
      });

      render(
        <TestWrapper>
          <SellPage />
        </TestWrapper>
      );

      // 카메라 촬영 버튼 클릭
      const cameraButton = screen.getByRole("button", {
        name: /카메라로 촬영/i,
      });
      await user.click(cameraButton);

      // 카메라 접근 요청 확인
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: false,
      });
    });
  });

  describe("1.4 리스트/검색 노출", () => {
    it("등록된 매물이 리스트에 노출된다", async () => {
      // Mock products data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "prod123",
            data: () => mockProduct,
          },
        ],
      });

      render(
        <TestWrapper>
          <ListPage />
        </TestWrapper>
      );

      // 매물이 리스트에 표시되는지 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
        expect(screen.getByText("1,500,000원")).toBeInTheDocument();
        expect(screen.getByText("서울시 강남구")).toBeInTheDocument();
      });
    });

    it("키워드 검색이 작동한다", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ListPage />
        </TestWrapper>
      );

      // 검색어 입력
      const searchInput = screen.getByPlaceholderText(/검색어를 입력하세요/i);
      await user.type(searchInput, "Fender");

      // 검색 버튼 클릭
      const searchButton = screen.getByRole("button", { name: /검색/i });
      await user.click(searchButton);

      // 검색 결과 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });
    });

    it("카테고리 필터가 작동한다", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ListPage />
        </TestWrapper>
      );

      // 카테고리 선택
      const categorySelect = screen.getByLabelText(/카테고리/i);
      await user.selectOptions(categorySelect, "string");

      // 필터 적용 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });
    });

    it("가격 범위 필터가 작동한다", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ListPage />
        </TestWrapper>
      );

      // 최소 가격 입력
      const minPriceInput = screen.getByLabelText(/최소 가격/i);
      await user.type(minPriceInput, "1000000");

      // 최대 가격 입력
      const maxPriceInput = screen.getByLabelText(/최대 가격/i);
      await user.type(maxPriceInput, "2000000");

      // 필터 적용 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });
    });

    it("지역 필터가 작동한다", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ListPage />
        </TestWrapper>
      );

      // 지역 선택
      const regionSelect = screen.getByLabelText(/지역/i);
      await user.selectOptions(regionSelect, "서울시 강남구");

      // 필터 적용 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });
    });

    it("정렬 기능이 작동한다", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ListPage />
        </TestWrapper>
      );

      // 정렬 옵션 선택
      const sortSelect = screen.getByLabelText(/정렬/i);
      await user.selectOptions(sortSelect, "price_asc");

      // 정렬 적용 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });
    });
  });
});


















