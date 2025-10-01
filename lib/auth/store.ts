import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../../data/types";
import { setUserOnlineStatus } from "../chat/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: async user => {
        set({
          user,
          isAuthenticated: !!user,
        });

        // 사용자 온라인 상태 설정
        if (user?.uid) {
          try {
            await setUserOnlineStatus(user.uid, true);

            // 페이지를 떠날 때 오프라인 상태로 설정
            const handleBeforeUnload = async () => {
              await setUserOnlineStatus(user.uid, false);
            };

            window.addEventListener("beforeunload", handleBeforeUnload);

            // 컴포넌트 언마운트 시에도 오프라인 상태로 설정
            const handleVisibilityChange = async () => {
              if (document.visibilityState === "hidden") {
                await setUserOnlineStatus(user.uid, false);
              } else if (document.visibilityState === "visible") {
                await setUserOnlineStatus(user.uid, true);
              }
            };

            document.addEventListener(
              "visibilitychange",
              handleVisibilityChange
            );

            // cleanup 함수를 반환할 수 없으므로 전역으로 저장
            (window as any).__authCleanup = () => {
              window.removeEventListener("beforeunload", handleBeforeUnload);
              document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
              );
            };
          } catch (error) {
            console.error("온라인 상태 설정 실패:", error);
          }
        }
      },
      setLoading: isLoading => set({ isLoading }),
      logout: async () => {
        const currentUser = useAuthStore.getState().user;

        // cleanup 함수 실행
        if ((window as any).__authCleanup) {
          (window as any).__authCleanup();
        }

        // 사용자 오프라인 상태 설정
        if (currentUser?.uid) {
          try {
            await setUserOnlineStatus(currentUser.uid, false);
          } catch (error) {
            console.error("오프라인 상태 설정 실패:", error);
          }
        }

        set({
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
