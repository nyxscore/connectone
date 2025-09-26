import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/AuthContext";
import ItemDetailPage from "@/app/item/[id]/page";
import ChatPage from "@/app/chat/page";
import ChatDetailPage from "@/app/chat/[chatId]/page";

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

const mockQA = {
  id: "qa123",
  productId: "prod123",
  userId: "user123",
  userName: "Test User",
  question: "상태는 어떤가요?",
  answer: "매우 좋은 상태입니다.",
  answeredBy: "seller123",
  answeredAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockChat = {
  id: "chat123",
  productId: "prod123",
  buyerId: "user123",
  sellerId: "seller123",
  lastMessage: "안녕하세요. 구매 문의드립니다.",
  lastMessageAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMessage = {
  id: "msg123",
  chatId: "chat123",
  senderId: "user123",
  receiverId: "seller123",
  content: "안녕하세요. 구매 문의드립니다.",
  type: "text",
  read: false,
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

describe("E2E 시나리오 2: 공개 Q&A 등록/삭제 → 1:1 채팅 생성 → 메시지 송수신", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("2.1 공개 Q&A 등록", () => {
    it("사용자가 공개 Q&A를 등록할 수 있다", async () => {
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

      // Q&A 섹션으로 스크롤
      const qaSection = screen.getByText(/Q&A/i);
      qaSection.scrollIntoView();

      // 질문 입력
      const questionInput = screen.getByPlaceholderText(/질문을 입력하세요/i);
      await user.type(questionInput, "상태는 어떤가요?");

      // 질문 등록 버튼 클릭
      const submitButton = screen.getByRole("button", { name: /질문 등록/i });
      await user.click(submitButton);

      // 성공 메시지 확인
      await waitFor(() => {
        expect(screen.getByText(/질문이 등록되었습니다/i)).toBeInTheDocument();
      });
    });

    it("판매자가 Q&A에 답변할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock seller user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockSeller);
          return () => {};
        }
      );

      // Mock product data
      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockProduct,
      });

      // Mock Q&A data with question
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "qa123",
            data: () => mockQA,
          },
        ],
      });

      render(
        <TestWrapper>
          <ItemDetailPage />
        </TestWrapper>
      );

      // 답변 입력
      const answerInput = screen.getByPlaceholderText(/답변을 입력하세요/i);
      await user.type(answerInput, "매우 좋은 상태입니다.");

      // 답변 등록 버튼 클릭
      const answerButton = screen.getByRole("button", { name: /답변 등록/i });
      await user.click(answerButton);

      // 성공 메시지 확인
      await waitFor(() => {
        expect(screen.getByText(/답변이 등록되었습니다/i)).toBeInTheDocument();
      });
    });

    it("작성자가 Q&A를 삭제할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock authenticated user (question author)
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
        docs: [
          {
            id: "qa123",
            data: () => mockQA,
          },
        ],
      });

      render(
        <TestWrapper>
          <ItemDetailPage />
        </TestWrapper>
      );

      // 삭제 버튼 클릭
      const deleteButton = screen.getByRole("button", { name: /삭제/i });
      await user.click(deleteButton);

      // 확인 다이얼로그
      const confirmButton = screen.getByRole("button", { name: /확인/i });
      await user.click(confirmButton);

      // 성공 메시지 확인
      await waitFor(() => {
        expect(screen.getByText(/질문이 삭제되었습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe("2.2 1:1 채팅 생성", () => {
    it("사용자가 1:1 채팅을 시작할 수 있다", async () => {
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

      render(
        <TestWrapper>
          <ItemDetailPage />
        </TestWrapper>
      );

      // 1:1 채팅 버튼 클릭
      const chatButton = screen.getByRole("button", { name: /1:1 채팅하기/i });
      await user.click(chatButton);

      // 채팅 페이지로 이동 확인
      await waitFor(() => {
        expect(
          screen.getByText(/채팅방이 생성되었습니다/i)
        ).toBeInTheDocument();
      });
    });

    it("기존 채팅이 있으면 기존 채팅방으로 이동한다", async () => {
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

      // Mock existing chat
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "chat123",
            data: () => mockChat,
          },
        ],
      });

      render(
        <TestWrapper>
          <ItemDetailPage />
        </TestWrapper>
      );

      // 1:1 채팅 버튼 클릭
      const chatButton = screen.getByRole("button", { name: /1:1 채팅하기/i });
      await user.click(chatButton);

      // 기존 채팅방으로 이동 확인
      await waitFor(() => {
        expect(
          screen.getByText(/기존 채팅방으로 이동합니다/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("2.3 메시지 송수신", () => {
    it("사용자가 메시지를 전송할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock chat data
      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockChat,
      });

      // Mock messages data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [],
      });

      render(
        <TestWrapper>
          <ChatDetailPage />
        </TestWrapper>
      );

      // 메시지 입력
      const messageInput = screen.getByPlaceholderText(/메시지를 입력하세요/i);
      await user.type(messageInput, "안녕하세요. 구매 문의드립니다.");

      // 전송 버튼 클릭
      const sendButton = screen.getByRole("button", { name: /전송/i });
      await user.click(sendButton);

      // 메시지가 표시되는지 확인
      await waitFor(() => {
        expect(
          screen.getByText("안녕하세요. 구매 문의드립니다.")
        ).toBeInTheDocument();
      });
    });

    it("이미지 메시지를 전송할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock chat data
      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockChat,
      });

      // Mock messages data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [],
      });

      render(
        <TestWrapper>
          <ChatDetailPage />
        </TestWrapper>
      );

      // 이미지 업로드 버튼 클릭
      const imageButton = screen.getByRole("button", { name: /이미지/i });
      await user.click(imageButton);

      // 이미지 파일 선택
      const fileInput = screen.getByLabelText(/이미지 업로드/i);
      const file = new File(["test"], "image.jpg", { type: "image/jpeg" });
      await user.upload(fileInput, file);

      // 이미지가 업로드되는지 확인
      await waitFor(() => {
        expect(screen.getByAltText(/업로드된 이미지/i)).toBeInTheDocument();
      });
    });

    it("실시간으로 메시지를 받을 수 있다", async () => {
      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock chat data
      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockChat,
      });

      // Mock messages data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "msg123",
            data: () => mockMessage,
          },
        ],
      });

      // Mock real-time updates
      let onSnapshotCallback: (snapshot: any) => void;
      vi.mocked(require("firebase/firestore").onSnapshot).mockImplementation(
        (ref, callback) => {
          onSnapshotCallback = callback;
          return () => {};
        }
      );

      render(
        <TestWrapper>
          <ChatDetailPage />
        </TestWrapper>
      );

      // 새로운 메시지 시뮬레이션
      const newMessage = {
        id: "msg124",
        data: () => ({
          ...mockMessage,
          id: "msg124",
          content: "네, 안녕하세요!",
          senderId: "seller123",
        }),
      };

      // 실시간 업데이트 트리거
      onSnapshotCallback({
        docs: [
          {
            id: "msg123",
            data: () => mockMessage,
          },
          newMessage,
        ],
      });

      // 새 메시지가 표시되는지 확인
      await waitFor(() => {
        expect(screen.getByText("네, 안녕하세요!")).toBeInTheDocument();
      });
    });

    it("메시지 읽음 상태가 업데이트된다", async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock chat data
      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockChat,
      });

      // Mock messages data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "msg123",
            data: () => mockMessage,
          },
        ],
      });

      render(
        <TestWrapper>
          <ChatDetailPage />
        </TestWrapper>
      );

      // 메시지 클릭 (읽음 처리)
      const message = screen.getByText("안녕하세요. 구매 문의드립니다.");
      await user.click(message);

      // 읽음 상태 업데이트 확인
      await waitFor(() => {
        expect(screen.getByText(/읽음/i)).toBeInTheDocument();
      });
    });
  });

  describe("2.4 채팅 목록 관리", () => {
    it("채팅 목록을 볼 수 있다", async () => {
      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock chats data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "chat123",
            data: () => mockChat,
          },
        ],
      });

      render(
        <TestWrapper>
          <ChatPage />
        </TestWrapper>
      );

      // 채팅 목록이 표시되는지 확인
      await waitFor(() => {
        expect(
          screen.getByText("Fender Stratocaster 2020")
        ).toBeInTheDocument();
        expect(
          screen.getByText("안녕하세요. 구매 문의드립니다.")
        ).toBeInTheDocument();
      });
    });

    it("채팅방을 검색할 수 있다", async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      vi.mocked(require("firebase/auth").onAuthStateChanged).mockImplementation(
        callback => {
          callback(mockUser);
          return () => {};
        }
      );

      // Mock chats data
      vi.mocked(require("firebase/firestore").getDocs).mockResolvedValue({
        docs: [
          {
            id: "chat123",
            data: () => mockChat,
          },
        ],
      });

      render(
        <TestWrapper>
          <ChatPage />
        </TestWrapper>
      );

      // 검색어 입력
      const searchInput = screen.getByPlaceholderText(/채팅방 검색/i);
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









