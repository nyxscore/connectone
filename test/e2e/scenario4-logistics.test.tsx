import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth/AuthContext';
import ItemDetailPage from '@/app/item/[id]/page';
import LogisticsQuoteModal from '@/components/ui/LogisticsQuoteModal';

// Mock data
const mockUser = {
  uid: 'user123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
};

const mockProduct = {
  id: 'prod123',
  title: 'Fender Stratocaster 2020',
  category: 'string',
  brand: 'Fender',
  model: 'Stratocaster',
  year: 2020,
  condition: 'A',
  price: 1500000,
  region: '서울시 강남구',
  description: '상태 좋은 기타입니다.',
  images: ['https://example.com/guitar1.jpg'],
  sellerId: 'seller123',
  sellerName: 'Seller User',
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'active',
  viewCount: 0,
  likeCount: 0,
};

const mockLogisticsQuote = {
  id: 'quote123',
  productId: 'prod123',
  fromAddress: '서울시 강남구',
  toAddress: '부산시 해운대구',
  insurance: true,
  estimatedPrice: 50000,
  estimatedDays: 3,
  carrierName: 'CJ대한통운',
  serviceType: '일반택배',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
};

const mockLogisticsOrder = {
  id: 'order123',
  productId: 'prod123',
  quoteId: 'quote123',
  buyerId: 'user123',
  sellerId: 'seller123',
  fromAddress: '서울시 강남구',
  toAddress: '부산시 해운대구',
  insurance: true,
  price: 50000,
  status: 'pending',
  trackingNumber: null,
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

describe('E2E 시나리오 4: 운송 견적 생성 → 주문 생성 더미', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('4.1 운송 견적 생성', () => {
    it('사용자가 운송 견적을 요청할 수 있다', async () => {
      const user = userEvent.setup();
      
      // Mock authenticated user
      vi.mocked(require('firebase/auth').onAuthStateChanged).mockImplementation((callback) => {
        callback(mockUser);
        return () => {};
      });

      // Mock product data
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockProduct,
      });

      render(
        <TestWrapper>
          <ItemDetailPage />
        </TestWrapper>
      );

      // 운송 견적 버튼 클릭
      const logisticsButton = screen.getByRole('button', { name: /운송 견적 받기/i });
      await user.click(logisticsButton);

      // 운송 견적 모달이 열리는지 확인
      await waitFor(() => {
        expect(screen.getByText(/운송 견적/i)).toBeInTheDocument();
        expect(screen.getByText('Fender Stratocaster 2020')).toBeInTheDocument();
      });
    });

    it('운송 견적 모달에서 주소 정보를 입력할 수 있다', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LogisticsQuoteModal
            isOpen={true}
            onClose={vi.fn()}
            product={mockProduct}
            onSuccess={vi.fn()}
          />
        </TestWrapper>
      );

      // 출발지 입력
      const fromAddressInput = screen.getByLabelText(/출발지/i);
      await user.type(fromAddressInput, '서울시 강남구');

      // 도착지 입력
      const toAddressInput = screen.getByLabelText(/도착지/i);
      await user.type(toAddressInput, '부산시 해운대구');

      // 층수 입력
      const floorInput = screen.getByLabelText(/층수/i);
      await user.type(floorInput, '3');

      // 엘리베이터 여부 선택
      const elevatorCheckbox = screen.getByLabelText(/엘리베이터/i);
      await user.click(elevatorCheckbox);

      // 보험 여부 선택
      const insuranceCheckbox = screen.getByLabelText(/보험/i);
      await user.click(insuranceCheckbox);

      // 견적 요청 버튼 클릭
      const requestButton = screen.getByRole('button', { name: /견적 요청/i });
      await user.click(requestButton);

      // 견적 요청 확인
      await waitFor(() => {
        expect(screen.getByText(/견적을 요청하고 있습니다/i)).toBeInTheDocument();
      });
    });

    it('운송 견적이 성공적으로 생성된다', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      
      // Mock quote creation
      vi.mocked(require('firebase/firestore').addDoc).mockResolvedValue({
        id: 'quote123',
      });

      // Mock quote data
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockLogisticsQuote,
      });

      render(
        <TestWrapper>
          <LogisticsQuoteModal
            isOpen={true}
            onClose={vi.fn()}
            product={mockProduct}
            onSuccess={onSuccess}
          />
        </TestWrapper>
      );

      // 주소 정보 입력
      const fromAddressInput = screen.getByLabelText(/출발지/i);
      await user.type(fromAddressInput, '서울시 강남구');

      const toAddressInput = screen.getByLabelText(/도착지/i);
      await user.type(toAddressInput, '부산시 해운대구');

      const floorInput = screen.getByLabelText(/층수/i);
      await user.type(floorInput, '3');

      const elevatorCheckbox = screen.getByLabelText(/엘리베이터/i);
      await user.click(elevatorCheckbox);

      const insuranceCheckbox = screen.getByLabelText(/보험/i);
      await user.click(insuranceCheckbox);

      // 견적 요청
      const requestButton = screen.getByRole('button', { name: /견적 요청/i });
      await user.click(requestButton);

      // 견적 결과 확인
      await waitFor(() => {
        expect(screen.getByText(/견적이 생성되었습니다/i)).toBeInTheDocument();
        expect(screen.getByText('50,000원')).toBeInTheDocument();
        expect(screen.getByText('3일')).toBeInTheDocument();
        expect(screen.getByText('CJ대한통운')).toBeInTheDocument();
      });
    });

    it('운송 견적 생성 시 이메일 알림이 발송된다', async () => {
      const user = userEvent.setup();
      
      // Mock quote creation
      vi.mocked(require('firebase/firestore').addDoc).mockResolvedValue({
        id: 'quote123',
      });

      // Mock quote data
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockLogisticsQuote,
      });

      // Mock email service
      const mockEmailService = {
        sendEmail: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(require('@/lib/email/service')).emailService = mockEmailService;

      render(
        <TestWrapper>
          <LogisticsQuoteModal
            isOpen={true}
            onClose={vi.fn()}
            product={mockProduct}
            onSuccess={vi.fn()}
          />
        </TestWrapper>
      );

      // 주소 정보 입력
      const fromAddressInput = screen.getByLabelText(/출발지/i);
      await user.type(fromAddressInput, '서울시 강남구');

      const toAddressInput = screen.getByLabelText(/도착지/i);
      await user.type(toAddressInput, '부산시 해운대구');

      const floorInput = screen.getByLabelText(/층수/i);
      await user.type(floorInput, '3');

      const elevatorCheckbox = screen.getByLabelText(/엘리베이터/i);
      await user.click(elevatorCheckbox);

      const insuranceCheckbox = screen.getByLabelText(/보험/i);
      await user.click(insuranceCheckbox);

      // 견적 요청
      const requestButton = screen.getByRole('button', { name: /견적 요청/i });
      await user.click(requestButton);

      // 이메일 발송 확인
      await waitFor(() => {
        expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'logistics_quote',
            recipientEmail: 'test@example.com',
          })
        );
      });
    });
  });

  describe('4.2 주문 생성 더미', () => {
    it('사용자가 운송 견적을 선택하여 주문을 생성할 수 있다', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      
      // Mock order creation
      vi.mocked(require('firebase/firestore').addDoc).mockResolvedValue({
        id: 'order123',
      });

      // Mock quote data
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockLogisticsQuote,
      });

      // Mock product data
      vi.mocked(require('firebase/firestore').getDoc').mockResolvedValue({
        exists: () => true,
        data: () => mockProduct,
      });

      render(
        <TestWrapper>
          <LogisticsQuoteModal
            isOpen={true}
            onClose={vi.fn()}
            product={mockProduct}
            onSuccess={onSuccess}
          />
        </TestWrapper>
      );

      // 견적 선택
      const selectButton = screen.getByRole('button', { name: /이 견적 선택/i });
      await user.click(selectButton);

      // 주문 생성 확인
      await waitFor(() => {
        expect(screen.getByText(/주문이 생성되었습니다/i)).toBeInTheDocument();
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('주문 생성 시 거래 수수료가 계산된다', async () => {
      const user = userEvent.setup();
      
      // Mock order creation
      vi.mocked(require('firebase/firestore').addDoc).mockResolvedValue({
        id: 'order123',
      });

      // Mock quote data
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockLogisticsQuote,
      });

      // Mock product data
      vi.mocked(require('firebase/firestore').getDoc').mockResolvedValue({
        exists: () => true,
        data: () => mockProduct,
      });

      render(
        <TestWrapper>
          <LogisticsQuoteModal
            isOpen={true}
            onClose={vi.fn()}
            product={mockProduct}
            onSuccess={vi.fn()}
          />
        </TestWrapper>
      );

      // 견적 선택
      const selectButton = screen.getByRole('button', { name: /이 견적 선택/i });
      await user.click(selectButton);

      // 수수료 계산 확인
      await waitFor(() => {
        expect(screen.getByText(/거래 수수료/i)).toBeInTheDocument();
        expect(screen.getByText(/총 금액/i)).toBeInTheDocument();
      });
    });

    it('주문 생성 시 결제와 분리되어 처리된다', async () => {
      const user = userEvent.setup();
      
      // Mock order creation
      vi.mocked(require('firebase/firestore').addDoc).mockResolvedValue({
        id: 'order123',
      });

      // Mock quote data
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockLogisticsQuote,
      });

      // Mock product data
      vi.mocked(require('firebase/firestore').getDoc').mockResolvedValue({
        exists: () => true,
        data: () => mockProduct,
      });

      render(
        <TestWrapper>
          <LogisticsQuoteModal
            isOpen={true}
            onClose={vi.fn()}
            product={mockProduct}
            onSuccess={vi.fn()}
          />
        </TestWrapper>
      );

      // 견적 선택
      const selectButton = screen.getByRole('button', { name: /이 견적 선택/i });
      await user.click(selectButton);

      // 주문 생성 확인 (결제와 분리)
      await waitFor(() => {
        expect(screen.getByText(/주문이 생성되었습니다/i)).toBeInTheDocument();
        expect(screen.getByText(/결제는 별도로 진행됩니다/i)).toBeInTheDocument();
      });
    });
  });

  describe('4.3 운송 견적 관리', () => {
    it('사용자가 운송 견적 목록을 볼 수 있다', async () => {
      // Mock authenticated user
      vi.mocked(require('firebase/auth').onAuthStateChanged).mockImplementation((callback) => {
        callback(mockUser);
        return () => {};
      });

      // Mock quotes data
      vi.mocked(require('firebase/firestore').getDocs).mockResolvedValue({
        docs: [{
          id: 'quote123',
          data: () => mockLogisticsQuote,
        }],
      });

      render(
        <TestWrapper>
          <div>운송 견적 목록 페이지</div>
        </TestWrapper>
      );

      // 견적 목록 확인
      await waitFor(() => {
        expect(screen.getByText('Fender Stratocaster 2020')).toBeInTheDocument();
        expect(screen.getByText('50,000원')).toBeInTheDocument();
        expect(screen.getByText('3일')).toBeInTheDocument();
      });
    });

    it('운송 견적을 검색할 수 있다', async () => {
      const user = userEvent.setup();
      
      // Mock authenticated user
      vi.mocked(require('firebase/auth').onAuthStateChanged).mockImplementation((callback) => {
        callback(mockUser);
        return () => {};
      });

      // Mock quotes data
      vi.mocked(require('firebase/firestore').getDocs).mockResolvedValue({
        docs: [{
          id: 'quote123',
          data: () => mockLogisticsQuote,
        }],
      });

      render(
        <TestWrapper>
          <div>운송 견적 목록 페이지</div>
        </TestWrapper>
      );

      // 검색어 입력
      const searchInput = screen.getByPlaceholderText(/견적 검색/i);
      await user.type(searchInput, 'Fender');

      // 검색 결과 확인
      await waitFor(() => {
        expect(screen.getByText('Fender Stratocaster 2020')).toBeInTheDocument();
      });
    });

    it('운송 견적 상태별로 필터링할 수 있다', async () => {
      const user = userEvent.setup();
      
      // Mock authenticated user
      vi.mocked(require('firebase/auth').onAuthStateChanged).mockImplementation((callback) => {
        callback(mockUser);
        return () => {};
      });

      // Mock quotes data
      vi.mocked(require('firebase/firestore').getDocs).mockResolvedValue({
        docs: [{
          id: 'quote123',
          data: () => mockLogisticsQuote,
        }],
      });

      render(
        <TestWrapper>
          <div>운송 견적 목록 페이지</div>
        </TestWrapper>
      );

      // 상태 필터 선택
      const statusFilter = screen.getByLabelText(/견적 상태/i);
      await user.selectOptions(statusFilter, 'active');

      // 필터 적용 확인
      await waitFor(() => {
        expect(screen.getByText('Fender Stratocaster 2020')).toBeInTheDocument();
      });
    });
  });

  describe('4.4 운송 주문 관리', () => {
    it('사용자가 운송 주문 목록을 볼 수 있다', async () => {
      // Mock authenticated user
      vi.mocked(require('firebase/auth').onAuthStateChanged).mockImplementation((callback) => {
        callback(mockUser);
        return () => {};
      });

      // Mock orders data
      vi.mocked(require('firebase/firestore').getDocs).mockResolvedValue({
        docs: [{
          id: 'order123',
          data: () => mockLogisticsOrder,
        }],
      });

      render(
        <TestWrapper>
          <div>운송 주문 목록 페이지</div>
        </TestWrapper>
      );

      // 주문 목록 확인
      await waitFor(() => {
        expect(screen.getByText('Fender Stratocaster 2020')).toBeInTheDocument();
        expect(screen.getByText('50,000원')).toBeInTheDocument();
        expect(screen.getByText(/주문 대기/i)).toBeInTheDocument();
      });
    });

    it('운송 주문 상태를 추적할 수 있다', async () => {
      // Mock authenticated user
      vi.mocked(require('firebase/auth').onAuthStateChanged).mockImplementation((callback) => {
        callback(mockUser);
        return () => {};
      });

      // Mock order with tracking
      const orderWithTracking = {
        ...mockLogisticsOrder,
        status: 'shipped',
        trackingNumber: 'CJ123456789',
      };

      vi.mocked(require('firebase/firestore').getDocs).mockResolvedValue({
        docs: [{
          id: 'order123',
          data: () => orderWithTracking,
        }],
      });

      render(
        <TestWrapper>
          <div>운송 주문 목록 페이지</div>
        </TestWrapper>
      );

      // 추적 정보 확인
      await waitFor(() => {
        expect(screen.getByText(/배송 중/i)).toBeInTheDocument();
        expect(screen.getByText('CJ123456789')).toBeInTheDocument();
      });
    });

    it('운송 주문을 취소할 수 있다', async () => {
      const user = userEvent.setup();
      
      // Mock authenticated user
      vi.mocked(require('firebase/auth').onAuthStateChanged).mockImplementation((callback) => {
        callback(mockUser);
        return () => {};
      });

      // Mock order data
      vi.mocked(require('firebase/firestore').getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockLogisticsOrder,
      });

      render(
        <TestWrapper>
          <div>운송 주문 상세 페이지</div>
        </TestWrapper>
      );

      // 취소 버튼 클릭
      const cancelButton = screen.getByRole('button', { name: /주문 취소/i });
      await user.click(cancelButton);

      // 확인 다이얼로그
      const confirmButton = screen.getByRole('button', { name: /확인/i });
      await user.click(confirmButton);

      // 취소 확인
      await waitFor(() => {
        expect(screen.getByText(/주문이 취소되었습니다/i)).toBeInTheDocument();
      });
    });
  });
});









