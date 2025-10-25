import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/AuthContext";
import AdminPage from "@/app/admin/page";
import ReportsPage from "@/app/admin/reports/page";
import UsersPage from "@/app/admin/users/page";
import ProductsPage from "@/app/admin/products/page";
import DisputesPage from "@/app/admin/disputes/page";

// Mock data
const mockAdmin = {
  uid: "admin123",
  email: "admin@connetone.com",
  displayName: "Admin User",
  photoURL: null,
  grade: "S", // Admin grade
};

const mockUser = {
  uid: "user123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
  grade: "C",
  safeTransactionCount: 0,
  averageRating: 0,
  disputeCount: 0,
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
  hidden: false,
  hiddenReason: null,
};

const mockReport = {
  id: "report123",
  type: "product",
  reporterId: "user123",
  reporterName: "Test User",
  reportedId: "prod123",
  reportedName: "Fender Stratocaster 2020",
  reason: "spam",
  description: "스팸 상품입니다.",
  status: "pending",
  adminNotes: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDispute = {
  id: "dispute123",
  transactionId: "tx123",
  reporterId: "user123",
  reporterName: "Test User",
  reportedId: "seller123",
  reportedName: "Seller User",
  reason: "product_mismatch",
  description: "상품과 설명이 다릅니다.",
  status: "pending",
  adminNotes: "",
  resolution: "",
  createdAt: new Date(),
  updatedAt: new Date(),
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

describe("E2E 시나리오 5: 관리자 신고 처리 → 사용자/매물 관리", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("5.1 관리자 대시보드", () => {
    it("관리자가 대시보드에 접근할 수 있다", async () => {
      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      render(
        <TestWrapper>
          <AdminPage />
        </TestWrapper>
      );

      // 대시보드 요소 확인
      await waitFor(() => {
        expect(screen.getByText(/관리자 대시보드/i)).toBeInTheDocument();
        expect(screen.getByText(/총 사용자/i)).toBeInTheDocument();
        expect(screen.getByText(/총 상품/i)).toBeInTheDocument();
        expect(screen.getByText(/신고 대기/i)).toBeInTheDocument();
        expect(screen.getByText(/분쟁 대기/i)).toBeInTheDocument();
      });
    });

    it("관리자가 아닌 사용자는 접근이 차단된다", async () => {
      // Mock regular user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      render(
        <TestWrapper>
          <AdminPage />
        </TestWrapper>
      );

      // 접근 차단 메시지 확인
      await waitFor(() => {
        expect(screen.getByText(/접근 권한이 없습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe("5.2 신고 처리", () => {
    it("관리자가 신고 목록을 볼 수 있다", async () => {
      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock reports data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "report123",
            data: () => mockReport,
          },
        ],
      });

      render(
        <TestWrapper>
          <ReportsPage />
        </TestWrapper>
      );

      // 신고 목록 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
        expect(screen.getByText("Test User")).toBeInTheDocument();
        expect(screen.getByText(/스팸/i)).toBeInTheDocument();
        expect(screen.getByText(/대기/i)).toBeInTheDocument();
      });
    });

    it("관리자가 신고를 승인할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock reports data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "report123",
            data: () => mockReport,
          },
        ],
      });

      // Mock update
      vi.mocked(require("firebase/firestore").updateDoc).mockResolvedValue(
        undefined
      );

      render(
        <TestWrapper>
          <ReportsPage />
        </TestWrapper>
      );

      // 승인 버튼 클릭
      const approveButton = screen.getByRole("button", { name: /승인/i });
      await user.click(approveButton);

      // 확인 다이얼로그
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 승인 확인
      await waitFor(() => {
        expect(screen.getByText(/신고가 승인되었습니다/i)).toBeInTheDocument();
      });
    });

    it("관리자가 신고를 기각할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock reports data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "report123",
            data: () => mockReport,
          },
        ],
      });

      // Mock update
      vi.mocked(require("firebase/firestore").updateDoc).mockResolvedValue(
        undefined
      );

      render(
        <TestWrapper>
          <ReportsPage />
        </TestWrapper>
      );

      // 기각 버튼 클릭
      const rejectButton = screen.getByRole("button", { name: /기각/i });
      await user.click(rejectButton);

      // 기각 사유 입력
      const reasonInput = screen.getByLabelText(/기각 사유/i);
      await user.type(reasonInput, "신고 사유가 불충분합니다.");

      // 확인 버튼 클릭
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 기각 확인
      await waitFor(() => {
        expect(screen.getByText(/신고가 기각되었습니다/i)).toBeInTheDocument();
      });
    });

    it("신고를 검색할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock reports data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "report123",
            data: () => mockReport,
          },
        ],
      });

      render(
        <TestWrapper>
          <ReportsPage />
        </TestWrapper>
      );

      // 검색어 입력
      const searchInput = screen.getByPlaceholderText(/신고 검색/i);
      await user.type(searchInput, "Fender");

      // 검색 결과 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });
    });
  });

  describe("5.3 사용자 관리", () => {
    it("관리자가 사용자 목록을 볼 수 있다", async () => {
      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock users data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "user123",
            data: () => mockUser,
          },
        ],
      });

      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );

      // 사용자 목록 확인
      await waitFor(() => {
        expect(screen.getByText("Test User")).toBeInTheDocument();
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
        expect(screen.getByText("C")).toBeInTheDocument();
        expect(screen.getByText(/활성/i)).toBeInTheDocument();
      });
    });

    it("관리자가 사용자를 정지할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock users data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "user123",
            data: () => mockUser,
          },
        ],
      });

      // Mock update
      vi.mocked(require("firebase/firestore").updateDoc).mockResolvedValue(
        undefined
      );

      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );

      // 정지 버튼 클릭
      const suspendButton = screen.getByRole("button", { name: /정지/i });
      await user.click(suspendButton);

      // 정지 사유 입력
      const reasonInput = screen.getByLabelText(/정지 사유/i);
      await user.type(reasonInput, "부적절한 행동");

      // 정지 기간 선택
      const durationSelect = screen.getByLabelText(/정지 기간/i);
      await user.selectOptions(durationSelect, "7");

      // 확인 버튼 클릭
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 정지 확인
      await waitFor(() => {
        expect(
          screen.getByText(/사용자가 정지되었습니다/i)
        ).toBeInTheDocument();
      });
    });

    it("관리자가 사용자 정지를 해제할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock suspended user
      const suspendedUser = {
        ...mockUser,
        suspended: true,
        suspensionReason: "부적절한 행동",
        suspensionEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "user123",
            data: () => suspendedUser,
          },
        ],
      });

      // Mock update
      vi.mocked(require("firebase/firestore").updateDoc).mockResolvedValue(
        undefined
      );

      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );

      // 해제 버튼 클릭
      const unsuspendButton = screen.getByRole("button", { name: /해제/i });
      await user.click(unsuspendButton);

      // 확인 다이얼로그
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 해제 확인
      await waitFor(() => {
        expect(
          screen.getByText(/사용자 정지가 해제되었습니다/i)
        ).toBeInTheDocument();
      });
    });

    it("사용자 등급을 관리할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock users data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "user123",
            data: () => mockUser,
          },
        ],
      });

      // Mock update
      vi.mocked(require("firebase/firestore").updateDoc).mockResolvedValue(
        undefined
      );

      render(
        <TestWrapper>
          <UsersPage />
        </TestWrapper>
      );

      // 등급 수정 버튼 클릭
      const gradeButton = screen.getByRole("button", { name: /등급 수정/i });
      await user.click(gradeButton);

      // 등급 선택
      const gradeSelect = screen.getByLabelText(/등급/i);
      await user.selectOptions(gradeSelect, "D");

      // 확인 버튼 클릭
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 등급 변경 확인
      await waitFor(() => {
        expect(
          screen.getByText(/사용자 등급이 변경되었습니다/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("5.4 매물 관리", () => {
    it("관리자가 매물 목록을 볼 수 있다", async () => {
      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

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
          <ProductsPage />
        </TestWrapper>
      );

      // 매물 목록 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
        expect(screen.getByText("Fender")).toBeInTheDocument();
        expect(screen.getByText("1,500,000원")).toBeInTheDocument();
        expect(screen.getByText("Seller User")).toBeInTheDocument();
        expect(screen.getByText(/노출/i)).toBeInTheDocument();
      });
    });

    it("관리자가 매물을 숨길 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock products data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "prod123",
            data: () => mockProduct,
          },
        ],
      });

      // Mock update
      vi.mocked(require("firebase/firestore").updateDoc).mockResolvedValue(
        undefined
      );

      render(
        <TestWrapper>
          <ProductsPage />
        </TestWrapper>
      );

      // 숨김 버튼 클릭
      const hideButton = screen.getByRole("button", { name: /숨김/i });
      await user.click(hideButton);

      // 숨김 사유 입력
      const reasonInput = screen.getByLabelText(/숨김 사유/i);
      await user.type(reasonInput, "부적절한 상품");

      // 확인 버튼 클릭
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 숨김 확인
      await waitFor(() => {
        expect(screen.getByText(/매물이 숨겨졌습니다/i)).toBeInTheDocument();
      });
    });

    it("관리자가 매물 숨김을 해제할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock hidden product
      const hiddenProduct = {
        ...mockProduct,
        hidden: true,
        hiddenReason: "부적절한 상품",
      };

      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "prod123",
            data: () => hiddenProduct,
          },
        ],
      });

      // Mock update
      vi.mocked(require("firebase/firestore").updateDoc).mockResolvedValue(
        undefined
      );

      render(
        <TestWrapper>
          <ProductsPage />
        </TestWrapper>
      );

      // 노출 버튼 클릭
      const showButton = screen.getByRole("button", { name: /노출/i });
      await user.click(showButton);

      // 확인 다이얼로그
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 노출 확인
      await waitFor(() => {
        expect(screen.getByText(/매물이 노출되었습니다/i)).toBeInTheDocument();
      });
    });

    it("매물을 검색할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

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
          <ProductsPage />
        </TestWrapper>
      );

      // 검색어 입력
      const searchInput = screen.getByPlaceholderText(/매물 검색/i);
      await user.type(searchInput, "Fender");

      // 검색 결과 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
      });
    });
  });

  describe("5.5 분쟁 처리", () => {
    it("관리자가 분쟁 목록을 볼 수 있다", async () => {
      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock disputes data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "dispute123",
            data: () => mockDispute,
          },
        ],
      });

      render(
        <TestWrapper>
          <DisputesPage />
        </TestWrapper>
      );

      // 분쟁 목록 확인
      await waitFor(() => {
        expect(screen.getByText("tx123")).toBeInTheDocument();
        expect(screen.getByText("Test User")).toBeInTheDocument();
        expect(screen.getByText("Seller User")).toBeInTheDocument();
        expect(screen.getByText(/상품 불일치/i)).toBeInTheDocument();
        expect(screen.getByText(/대기/i)).toBeInTheDocument();
      });
    });

    it("관리자가 분쟁을 조사할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock disputes data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "dispute123",
            data: () => mockDispute,
          },
        ],
      });

      // Mock update
      vi.mocked(require("firebase/firestore").updateDoc).mockResolvedValue(
        undefined
      );

      render(
        <TestWrapper>
          <DisputesPage />
        </TestWrapper>
      );

      // 조사 시작 버튼 클릭
      const investigateButton = screen.getByRole("button", {
        name: /조사 시작/i,
      });
      await user.click(investigateButton);

      // 조사 노트 입력
      const notesInput = screen.getByLabelText(/조사 노트/i);
      await user.type(notesInput, "거래 내역을 확인했습니다.");

      // 확인 버튼 클릭
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 조사 시작 확인
      await waitFor(() => {
        expect(screen.getByText(/조사가 시작되었습니다/i)).toBeInTheDocument();
      });
    });

    it("관리자가 분쟁을 해결할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock disputes data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "dispute123",
            data: () => mockDispute,
          },
        ],
      });

      // Mock update
      vi.mocked(require("firebase/firestore").updateDoc).mockResolvedValue(
        undefined
      );

      render(
        <TestWrapper>
          <DisputesPage />
        </TestWrapper>
      );

      // 해결 버튼 클릭
      const resolveButton = screen.getByRole("button", { name: /해결/i });
      await user.click(resolveButton);

      // 해결 방안 입력
      const resolutionInput = screen.getByLabelText(/해결 방안/i);
      await user.type(resolutionInput, "환불 처리합니다.");

      // 확인 버튼 클릭
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 해결 확인
      await waitFor(() => {
        expect(screen.getByText(/분쟁이 해결되었습니다/i)).toBeInTheDocument();
      });
    });

    it("관리자가 분쟁을 기각할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock admin user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockAdmin);
          return () => {};
        }
      );

      // Mock disputes data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "dispute123",
            data: () => mockDispute,
          },
        ],
      });

      // Mock update
      vi.mocked(require("firebase/firestore").updateDoc).mockResolvedValue(
        undefined
      );

      render(
        <TestWrapper>
          <DisputesPage />
        </TestWrapper>
      );

      // 기각 버튼 클릭
      const dismissButton = screen.getByRole("button", { name: /기각/i });
      await user.click(dismissButton);

      // 기각 사유 입력
      const reasonInput = screen.getByLabelText(/기각 사유/i);
      await user.type(reasonInput, "분쟁 사유가 불충분합니다.");

      // 확인 버튼 클릭
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 기각 확인
      await waitFor(() => {
        expect(screen.getByText(/분쟁이 기각되었습니다/i)).toBeInTheDocument();
      });
    });
  });
});













































