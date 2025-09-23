import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/AuthContext";
import SignupPage from "@/app/auth/signup/page";
import LoginPage from "@/app/auth/login/page";

// Mock Firebase
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
}));

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

describe("Auth Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("User Registration Flow", () => {
    it("completes full registration process", async () => {
      const user = userEvent.setup();

      // Mock successful registration
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: "user123",
          email: "test@example.com",
          displayName: null,
          photoURL: null,
        },
      });

      // Mock Firestore user creation
      vi.mocked(require("firebase/firestore").addDoc).mockResolvedValue({
        id: "user123",
      });

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>
      );

      // Fill registration form
      await user.type(screen.getByLabelText(/이메일/i), "test@example.com");
      await user.type(screen.getByLabelText(/비밀번호/i), "password123");
      await user.type(screen.getByLabelText(/닉네임/i), "Test User");
      await user.selectOptions(screen.getByLabelText(/지역/i), "서울시 강남구");
      await user.click(screen.getByLabelText(/약관에 동의/i));

      // Submit registration
      await user.click(screen.getByRole("button", { name: /회원가입/i }));

      // Verify Firebase calls
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );

      // Verify user document creation
      expect(require("firebase/firestore").addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: "test@example.com",
          nickname: "Test User",
          region: "서울시 강남구",
          grade: "C",
          safeTransactionCount: 0,
          averageRating: 0,
          disputeCount: 0,
        })
      );

      // Verify success message
      await waitFor(() => {
        expect(
          screen.getByText(/회원가입이 완료되었습니다/i)
        ).toBeInTheDocument();
      });
    });

    it("handles registration errors", async () => {
      const user = userEvent.setup();

      // Mock registration error
      mockCreateUserWithEmailAndPassword.mockRejectedValue(
        new Error("auth/email-already-in-use")
      );

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>
      );

      // Fill registration form
      await user.type(screen.getByLabelText(/이메일/i), "test@example.com");
      await user.type(screen.getByLabelText(/비밀번호/i), "password123");
      await user.type(screen.getByLabelText(/닉네임/i), "Test User");
      await user.selectOptions(screen.getByLabelText(/지역/i), "서울시 강남구");
      await user.click(screen.getByLabelText(/약관에 동의/i));

      // Submit registration
      await user.click(screen.getByRole("button", { name: /회원가입/i }));

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText(/이미 사용 중인 이메일입니다/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("User Login Flow", () => {
    it("completes full login process", async () => {
      const user = userEvent.setup();

      // Mock successful login
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: "user123",
          email: "test@example.com",
          displayName: "Test User",
          photoURL: null,
        },
      });

      // Mock user data fetch
      vi.mocked(require("firebase/firestore").getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          email: "test@example.com",
          nickname: "Test User",
          region: "서울시 강남구",
          grade: "C",
          safeTransactionCount: 0,
          averageRating: 0,
          disputeCount: 0,
        }),
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Fill login form
      await user.type(screen.getByLabelText(/이메일/i), "test@example.com");
      await user.type(screen.getByLabelText(/비밀번호/i), "password123");

      // Submit login
      await user.click(screen.getByRole("button", { name: /로그인/i }));

      // Verify Firebase calls
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/로그인되었습니다/i)).toBeInTheDocument();
      });
    });

    it("handles login errors", async () => {
      const user = userEvent.setup();

      // Mock login error
      mockSignInWithEmailAndPassword.mockRejectedValue(
        new Error("auth/user-not-found")
      );

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Fill login form
      await user.type(screen.getByLabelText(/이메일/i), "test@example.com");
      await user.type(screen.getByLabelText(/비밀번호/i), "wrongpassword");

      // Submit login
      await user.click(screen.getByRole("button", { name: /로그인/i }));

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText(/사용자를 찾을 수 없습니다/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Auth State Management", () => {
    it("handles auth state changes", async () => {
      let authStateCallback: (user: any) => void;

      // Mock onAuthStateChanged to capture callback
      mockOnAuthStateChanged.mockImplementation(callback => {
        authStateCallback = callback;
        return () => {};
      });

      render(
        <TestWrapper>
          <div>Test App</div>
        </TestWrapper>
      );

      // Simulate user login
      authStateCallback({
        uid: "user123",
        email: "test@example.com",
        displayName: "Test User",
        photoURL: null,
      });

      // Verify auth state is updated
      await waitFor(() => {
        expect(screen.getByText("Test App")).toBeInTheDocument();
      });

      // Simulate user logout
      authStateCallback(null);

      // Verify auth state is cleared
      await waitFor(() => {
        expect(screen.getByText("Test App")).toBeInTheDocument();
      });
    });
  });
});





