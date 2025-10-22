import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/AuthContext";
import SellPage from "@/app/sell/page";
import ListPage from "@/app/list/page";
import ItemDetailPage from "@/app/item/[id]/page";

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

describe("Product Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Product Creation Flow", () => {
    it("completes full product creation process", async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock product creation
      vi.mocked(require("firebase/firestore").addDoc).mockResolvedValue({
        id: "prod123",
      });

      // Mock image upload
      vi.mocked(require("firebase/storage").uploadBytes).mockResolvedValue({
        ref: { fullPath: "products/prod123/image1.jpg" },
      });
      vi.mocked(require("firebase/storage").getDownloadURL).mockResolvedValue(
        "https://example.com/guitar1.jpg"
      );

      // Mock Vision API
      vi.mocked(require("@/lib/api/vision").analyzeImage).mockResolvedValue({
        aiTags: ["Fender", "Stratocaster"],
        suggestions: {
          brand: "Fender",
          model: "Stratocaster",
        },
      });

      // Mock inspection API
      vi.mocked(
        require("@/lib/api/inspection").inspectInstrument
      ).mockResolvedValue({
        conditionHint: "A",
        defects: [],
        recommendations: "매우 좋은 상태입니다.",
      });

      render(
        <TestWrapper>
          <SellPage />
        </TestWrapper>
      );

      // Fill product form
      await user.type(
        screen.getByLabelText(/제목/i),
        "Fender Stratocaster 2020"
      );
      await user.selectOptions(screen.getByLabelText(/카테고리/i), "string");
      await user.type(screen.getByLabelText(/브랜드/i), "Fender");
      await user.type(screen.getByLabelText(/모델/i), "Stratocaster");
      await user.type(screen.getByLabelText(/연도/i), "2020");
      await user.selectOptions(screen.getByLabelText(/상태/i), "A");
      await user.type(screen.getByLabelText(/가격/i), "1500000");
      await user.selectOptions(
        screen.getByLabelText(/거래 지역/i),
        "서울시 강남구"
      );
      await user.type(
        screen.getByLabelText(/상품 설명/i),
        "상태 좋은 기타입니다."
      );

      // Upload image
      const fileInput = screen.getByLabelText(/이미지 업로드/i);
      const file = new File(["test"], "guitar.jpg", { type: "image/jpeg" });
      await user.upload(fileInput, file);

      // Wait for AI analysis
      await waitFor(() => {
        expect(screen.getByText(/AI 분석 중/i)).toBeInTheDocument();
      });

      // Wait for AI suggestions
      await waitFor(() => {
        expect(screen.getByText(/Fender/i)).toBeInTheDocument();
        expect(screen.getByText(/Stratocaster/i)).toBeInTheDocument();
      });

      // Select AI suggestions
      const brandButton = screen.getByRole("button", { name: /Fender/i });
      await user.click(brandButton);

      const modelButton = screen.getByRole("button", { name: /Stratocaster/i });
      await user.click(modelButton);

      // Submit product
      await user.click(screen.getByRole("button", { name: /등록하기/i }));

      // Verify product creation
      expect(require("firebase/firestore").addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: "Fender Stratocaster 2020",
          category: "string",
          brand: "Fender",
          model: "Stratocaster",
          year: 2020,
          condition: "A",
          price: 1500000,
          region: "서울시 강남구",
          description: "상태 좋은 기타입니다.",
          sellerId: "user123",
          sellerName: "Test User",
          status: "active",
        })
      );

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/상품이 등록되었습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe("Product Listing Flow", () => {
    it("displays products in list with search and filters", async () => {
      const user = userEvent.setup();

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

      // Verify product is displayed
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
        expect(screen.getByText("1,500,000원")).toBeInTheDocument();
        expect(screen.getByText("서울시 강남구")).toBeInTheDocument();
      });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/검색어를 입력하세요/i);
      await user.type(searchInput, "Fender");

      const searchButton = screen.getByRole("button", { name: /검색/i });
      await user.click(searchButton);

      // Verify search results
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });

      // Test category filter
      const categorySelect = screen.getByLabelText(/카테고리/i);
      await user.selectOptions(categorySelect, "string");

      // Verify filter results
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });

      // Test price range filter
      const minPriceInput = screen.getByLabelText(/최소 가격/i);
      await user.type(minPriceInput, "1000000");

      const maxPriceInput = screen.getByLabelText(/최대 가격/i);
      await user.type(maxPriceInput, "2000000");

      // Verify price filter results
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Product Detail Flow", () => {
    it("displays product details with Q&A and chat functionality", async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock product data
      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockProduct,
      });

      // Mock Q&A data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [],
      });

      render(
        <TestWrapper>
          <ItemDetailPage />
        </TestWrapper>
      );

      // Verify product details
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
        expect(screen.getByText("1,500,000원")).toBeInTheDocument();
        expect(screen.getByText("Fender")).toBeInTheDocument();
        expect(screen.getByText("Stratocaster")).toBeInTheDocument();
        expect(screen.getByText("2020")).toBeInTheDocument();
        expect(screen.getByText("A")).toBeInTheDocument();
        expect(screen.getByText("서울시 강남구")).toBeInTheDocument();
        expect(screen.getByText("상태 좋은 기타입니다.")).toBeInTheDocument();
      });

      // Test Q&A functionality
      const questionInput = screen.getByPlaceholderText(/질문을 입력하세요/i);
      await user.type(questionInput, "상태는 어떤가요?");

      const questionButton = screen.getByRole("button", { name: /질문 등록/i });
      await user.click(questionButton);

      // Verify Q&A submission
      expect(require("firebase/firestore").addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          productId: "prod123",
          userId: "user123",
          userName: "Test User",
          question: "상태는 어떤가요?",
        })
      );

      // Test chat functionality
      const chatButton = screen.getByRole("button", { name: /1:1 채팅하기/i });
      await user.click(chatButton);

      // Verify chat creation
      expect(require("firebase/firestore").addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          productId: "prod123",
          buyerId: "user123",
          sellerId: "user123",
        })
      );

      // Test payment functionality
      const paymentButton = screen.getByRole("button", {
        name: /안전결제로 구매/i,
      });
      await user.click(paymentButton);

      // Verify payment modal opens
      await waitFor(() => {
        expect(screen.getByText(/결제 정보/i)).toBeInTheDocument();
      });

      // Test logistics functionality
      const logisticsButton = screen.getByRole("button", {
        name: /운송 견적 받기/i,
      });
      await user.click(logisticsButton);

      // Verify logistics modal opens
      await waitFor(() => {
        expect(screen.getByText(/운송 견적/i)).toBeInTheDocument();
      });
    });
  });
});










































