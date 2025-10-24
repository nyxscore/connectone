import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/AuthContext";
import ItemDetailPage from "@/app/item/[id]/page";
import PaymentModal from "@/components/ui/PaymentModal";
import TransactionsPage from "@/app/profile/transactions/page";

// Mock data
const mockUser = {
  uid: "user123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
};

const mockSeller = {
  uid: "seller123",
  email: "seller@example.com",
  displayName: "Seller User",
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
  sellerId: "seller123",
  sellerName: "Seller User",
  createdAt: new Date(),
  updatedAt: new Date(),
  status: "active",
  viewCount: 0,
  likeCount: 0,
};

const mockTransaction = {
  id: "tx123",
  productId: "prod123",
  buyerId: "user123",
  sellerId: "seller123",
  amount: 1500000,
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date(),
  product: mockProduct,
  buyer: mockUser,
  seller: mockSeller,
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

describe("E2E 시나리오 3: 안전결제 더미 결제 → 거래 상태 전환 → 거래 완료", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("3.1 안전결제 더미 결제", () => {
    it("사용자가 안전결제로 구매할 수 있다", async () => {
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

      // Mock transaction creation
      vi.mocked(require("firebase/firestore").addDoc).mockResolvedValue({
        id: "tx123",
      });

      render(
        <TestWrapper>
          <ItemDetailPage />
        </TestWrapper>
      );

      // 안전결제 버튼 클릭
      const paymentButton = screen.getByRole("button", {
        name: /안전결제로 구매/i,
      });
      await user.click(paymentButton);

      // 결제 모달이 열리는지 확인
      await waitFor(() => {
        expect(screen.getByText(/결제 정보/i)).toBeInTheDocument();
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
        expect(screen.getByText("1,500,000원")).toBeInTheDocument();
      });
    });

    it("결제 모달에서 결제 정보를 입력할 수 있다", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PaymentModal
            isOpen={true}
            onClose={vi.fn()}
            product={mockProduct}
            onSuccess={vi.fn()}
          />
        </TestWrapper>
      );

      // 결제 정보 입력
      const cardNumberInput = screen.getByLabelText(/카드 번호/i);
      await user.type(cardNumberInput, "1234567890123456");

      const expiryInput = screen.getByLabelText(/만료일/i);
      await user.type(expiryInput, "12/25");

      const cvvInput = screen.getByLabelText(/CVV/i);
      await user.type(cvvInput, "123");

      const nameInput = screen.getByLabelText(/카드 소유자명/i);
      await user.type(nameInput, "Test User");

      // 결제 진행 버튼 클릭
      const proceedButton = screen.getByRole("button", { name: /결제 진행/i });
      await user.click(proceedButton);

      // 결제 처리 중 상태 확인
      await waitFor(() => {
        expect(screen.getByText(/결제 처리 중/i)).toBeInTheDocument();
      });
    });

    it("더미 결제가 성공적으로 완료된다", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(
        <TestWrapper>
          <PaymentModal
            isOpen={true}
            onClose={vi.fn()}
            product={mockProduct}
            onSuccess={onSuccess}
          />
        </TestWrapper>
      );

      // 결제 정보 입력
      const cardNumberInput = screen.getByLabelText(/카드 번호/i);
      await user.type(cardNumberInput, "1234567890123456");

      const expiryInput = screen.getByLabelText(/만료일/i);
      await user.type(expiryInput, "12/25");

      const cvvInput = screen.getByLabelText(/CVV/i);
      await user.type(cvvInput, "123");

      const nameInput = screen.getByLabelText(/카드 소유자명/i);
      await user.type(nameInput, "Test User");

      // 결제 진행 버튼 클릭
      const proceedButton = screen.getByRole("button", { name: /결제 진행/i });
      await user.click(proceedButton);

      // 결제 성공 확인
      await waitFor(() => {
        expect(screen.getByText(/결제가 완료되었습니다/i)).toBeInTheDocument();
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("결제 실패 시 에러 메시지를 표시한다", async () => {
      const user = userEvent.setup();

      // Mock payment failure
      vi.mocked(require("firebase/firestore").addDoc).mockRejectedValue(
        new Error("Payment failed")
      );

      render(
        <TestWrapper>
          <PaymentModal
            isOpen={true}
            onClose={vi.fn()}
            product={mockProduct}
            onSuccess={vi.fn()}
          />
        </TestWrapper>
      );

      // 결제 정보 입력
      const cardNumberInput = screen.getByLabelText(/카드 번호/i);
      await user.type(cardNumberInput, "0000000000000000"); // Invalid card

      const expiryInput = screen.getByLabelText(/만료일/i);
      await user.type(expiryInput, "12/25");

      const cvvInput = screen.getByLabelText(/CVV/i);
      await user.type(cvvInput, "123");

      const nameInput = screen.getByLabelText(/카드 소유자명/i);
      await user.type(nameInput, "Test User");

      // 결제 진행 버튼 클릭
      const proceedButton = screen.getByRole("button", { name: /결제 진행/i });
      await user.click(proceedButton);

      // 에러 메시지 확인
      await waitFor(() => {
        expect(screen.getByText(/결제에 실패했습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe("3.2 거래 상태 전환", () => {
    it("판매자가 거래 상태를 업데이트할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock seller user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockSeller);
          return () => {};
        }
      );

      // Mock transaction data
      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockTransaction,
      });

      render(
        <TestWrapper>
          <TransactionsPage />
        </TestWrapper>
      );

      // 거래 상태 업데이트 버튼 클릭
      const updateButton = screen.getByRole("button", {
        name: /상태 업데이트/i,
      });
      await user.click(updateButton);

      // 상태 선택
      const statusSelect = screen.getByLabelText(/거래 상태/i);
      await user.selectOptions(statusSelect, "shipped");

      // 업데이트 버튼 클릭
      const confirmButton = screen.getByRole("button", { name: /업데이트/i });
      await user.click(confirmButton);

      // 성공 메시지 확인
      await waitFor(() => {
        expect(
          screen.getByText(/거래 상태가 업데이트되었습니다/i)
        ).toBeInTheDocument();
      });
    });

    it("거래 상태별로 적절한 UI가 표시된다", async () => {
      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock different transaction statuses
      const transactions = [
        { ...mockTransaction, status: "pending" },
        { ...mockTransaction, status: "paid_hold" },
        { ...mockTransaction, status: "shipped" },
        { ...mockTransaction, status: "delivered" },
        { ...mockTransaction, status: "released" },
      ];

      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: transactions.map(tx => ({
          id: tx.id,
          data: () => tx,
        })),
      });

      render(
        <TestWrapper>
          <TransactionsPage />
        </TestWrapper>
      );

      // 각 상태별 UI 확인
      await waitFor(() => {
        expect(screen.getByText(/결제 대기/i)).toBeInTheDocument();
        expect(screen.getByText(/결제 완료/i)).toBeInTheDocument();
        expect(screen.getByText(/배송 중/i)).toBeInTheDocument();
        expect(screen.getByText(/배송 완료/i)).toBeInTheDocument();
        expect(screen.getByText(/거래 완료/i)).toBeInTheDocument();
      });
    });

    it("거래 상태 변경 시 이메일 알림이 발송된다", async () => {
      const user = userEvent.setup();

      // Mock seller user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockSeller);
          return () => {};
        }
      );

      // Mock transaction data
      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockTransaction,
      });

      // Mock email service
      const mockEmailService = {
        sendEmail: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(require("@/lib/email/service")).emailService = mockEmailService;

      render(
        <TestWrapper>
          <TransactionsPage />
        </TestWrapper>
      );

      // 거래 상태 업데이트
      const updateButton = screen.getByRole("button", {
        name: /상태 업데이트/i,
      });
      await user.click(updateButton);

      const statusSelect = screen.getByLabelText(/거래 상태/i);
      await user.selectOptions(statusSelect, "shipped");

      const confirmButton = screen.getByRole("button", { name: /업데이트/i });
      await user.click(confirmButton);

      // 이메일 발송 확인
      await waitFor(() => {
        expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "transaction_update",
            recipientEmail: "test@example.com",
          })
        );
      });
    });
  });

  describe("3.3 거래 완료", () => {
    it("거래가 완료되면 최종 상태로 변경된다", async () => {
      const user = userEvent.setup();

      // Mock seller user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockSeller);
          return () => {};
        }
      );

      // Mock transaction data
      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockTransaction,
      });

      render(
        <TestWrapper>
          <TransactionsPage />
        </TestWrapper>
      );

      // 거래 완료 버튼 클릭
      const completeButton = screen.getByRole("button", { name: /거래 완료/i });
      await user.click(completeButton);

      // 확인 다이얼로그
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 거래 완료 확인
      await waitFor(() => {
        expect(screen.getByText(/거래가 완료되었습니다/i)).toBeInTheDocument();
      });
    });

    it("거래 완료 후 사용자 등급이 업데이트된다", async () => {
      const user = userEvent.setup();

      // Mock seller user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockSeller);
          return () => {};
        }
      );

      // Mock transaction data
      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockTransaction,
      });

      // Mock user update
      vi.mocked(require("firebase/firestore").updateDoc).mockResolvedValue(
        undefined
      );

      render(
        <TestWrapper>
          <TransactionsPage />
        </TestWrapper>
      );

      // 거래 완료
      const completeButton = screen.getByRole("button", { name: /거래 완료/i });
      await user.click(completeButton);

      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 사용자 등급 업데이트 확인
      await waitFor(() => {
        expect(require("firebase/firestore").updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            safeTransactionCount: expect.any(Number),
          })
        );
      });
    });

    it("거래 완료 후 리뷰 작성이 가능하다", async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock completed transaction
      const completedTransaction = {
        ...mockTransaction,
        status: "released",
      };

      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => completedTransaction,
      });

      render(
        <TestWrapper>
          <TransactionsPage />
        </TestWrapper>
      );

      // 리뷰 작성 버튼 클릭
      const reviewButton = screen.getByRole("button", { name: /리뷰 작성/i });
      await user.click(reviewButton);

      // 리뷰 작성 폼 확인
      await waitFor(() => {
        expect(screen.getByText(/리뷰 작성/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/평점/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/리뷰 내용/i)).toBeInTheDocument();
      });
    });
  });

  describe("3.4 거래 내역 관리", () => {
    it("사용자가 거래 내역을 볼 수 있다", async () => {
      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock transactions data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "tx123",
            data: () => mockTransaction,
          },
        ],
      });

      render(
        <TestWrapper>
          <TransactionsPage />
        </TestWrapper>
      );

      // 거래 내역 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
        expect(screen.getByText("1,500,000원")).toBeInTheDocument();
        expect(screen.getByText(/결제 대기/i)).toBeInTheDocument();
      });
    });

    it("거래 상태별로 필터링할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock transactions data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "tx123",
            data: () => mockTransaction,
          },
        ],
      });

      render(
        <TestWrapper>
          <TransactionsPage />
        </TestWrapper>
      );

      // 상태 필터 선택
      const statusFilter = screen.getByLabelText(/거래 상태/i);
      await user.selectOptions(statusFilter, "pending");

      // 필터 적용 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });
    });

    it("거래 내역을 검색할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock transactions data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "tx123",
            data: () => mockTransaction,
          },
        ],
      });

      render(
        <TestWrapper>
          <TransactionsPage />
        </TestWrapper>
      );

      // 검색어 입력
      const searchInput = screen.getByPlaceholderText(/거래 내역 검색/i);
      await user.type(searchInput, "Fender");

      // 검색 결과 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });
    });
  });
});












































