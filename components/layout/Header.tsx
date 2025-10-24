"use client";

import Link from "next/link";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { ProfileDropdown } from "../profile/ProfileDropdown";
import {
  getTotalUnreadMessageCount,
  subscribeToUnreadCount,
} from "../../lib/chat/api";
import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  deleteAllNotifications,
  subscribeToNotifications,
  subscribeToUnreadNotificationCount,
} from "../../lib/api/notifications";
import type { Notification } from "../../data/types";
import {
  MessageCircle,
  Menu,
  X,
  Bell,
  ChevronDown,
  ChevronUp,
  Trash2,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  // 알림 관련 상태
  const [isMobileNotificationOpen, setIsMobileNotificationOpen] =
    useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // 읽지 않은 메시지 개수 로드
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    // 초기 로드
    const loadUnreadCount = async () => {
      try {
        const result = await getTotalUnreadMessageCount(user.uid);
        if (result.success) {
          setUnreadCount(result.count || 0);
        }
      } catch (error) {
        console.error("읽지 않은 메시지 개수 로드 실패:", error);
      }
    };

    loadUnreadCount();

    // 실시간 구독
    const unsubscribe = subscribeToUnreadCount(
      user.uid,
      count => {
        const previousCount = unreadCount;
        setUnreadCount(count);

        // 새로운 메시지가 있을 때 브라우저 알림 표시
        if (count > previousCount && previousCount > 0) {
          // 브라우저 알림 권한 확인 및 요청
          if (Notification.permission === "granted") {
            new Notification("ConnecTone", {
              body: `새로운 메시지가 ${count - previousCount}개 도착했습니다!`,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              tag: "new-message",
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                new Notification("ConnecTone", {
                  body: `새로운 메시지가 ${count - previousCount}개 도착했습니다!`,
                  icon: "/favicon.ico",
                  badge: "/favicon.ico",
                  tag: "new-message",
                });
              }
            });
          }
        }
      },
      error => {
        console.error("읽지 않은 메시지 구독 오류:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // 알림 데이터 로드 및 실시간 구독
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }

    // 초기 알림 로드
    const loadNotifications = async () => {
      setIsLoadingNotifications(true);
      try {
        const result = await getUserNotifications(user.uid, 20);
        if (result.success && result.notifications) {
          setNotifications(result.notifications);
        }
      } catch (error) {
        console.error("알림 로드 실패:", error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    loadNotifications();

    // 실시간 알림 구독
    const unsubscribeNotifications = subscribeToNotifications(
      user.uid,
      newNotifications => {
        setNotifications(newNotifications);
      },
      error => {
        console.error("알림 구독 오류:", error);
      }
    );

    // 실시간 읽지 않은 알림 개수 구독
    const unsubscribeUnreadCount = subscribeToUnreadNotificationCount(
      user.uid,
      count => {
        setUnreadNotificationCount(count);
      },
      error => {
        console.error("읽지 않은 알림 개수 구독 오류:", error);
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user?.uid]);

  // 알림 관련 핸들러 함수들
  const handleDeleteNotification = async (id: string) => {
    if (!user?.uid) return;

    try {
      const result = await deleteNotification(id, user.uid);
      if (result.success) {
        toast.success("알림이 삭제되었습니다.");
      } else {
        toast.error(result.error || "알림 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("알림 삭제 오류:", error);
      toast.error("알림 삭제에 실패했습니다.");
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!user?.uid) return;

    try {
      const result = await deleteAllNotifications(user.uid);
      if (!result.success) {
        toast.error(result.error || "알림 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("알림 삭제 오류:", error);
      toast.error("알림 삭제에 실패했습니다.");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!user?.uid) return;

    // 읽지 않은 알림이면 읽음 처리
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id, user.uid);
      } catch (error) {
        console.error("알림 읽음 처리 오류:", error);
      }
    }

    // 링크가 있으면 해당 페이지로 이동
    if (notification.link) {
      window.location.href = notification.link;
      setIsMobileMenuOpen(false);
    }
  };

  // 검색 관련 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchSuggestions(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSearchSuggestions(e.target.value.length > 0);
  };

  // 검색 제안 상태
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // 검색 제안 가져오기
  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setSearchSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("검색 제안 오류:", error);
      setSearchSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // 검색어 변경 시 제안 업데이트
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300); // 300ms 디바운스

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center -space-x-2">
              <img src="/logo1.png" alt="ConnecTone" className="h-10 w-auto" />
              <img src="/logo2.png" alt="ConnecTone" className="h-10 w-auto" />
            </Link>
          </div>

          {/* 검색바 - 데스크톱 */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <form onSubmit={handleSearch} className="w-full relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => setShowSearchSuggestions(searchQuery.length > 0)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  placeholder="악기 검색 (예: 중고 기타, 피아노, 드럼...)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  검색
                </button>
              </div>
              
              {/* 검색 제안 드롭다운 */}
              {showSearchSuggestions && (searchSuggestions.length > 0 || loadingSuggestions) && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
                  <div className="p-2">
                    <div className="text-xs text-gray-500 mb-2 px-2">
                      {loadingSuggestions ? "검색 중..." : "검색 제안"}
                    </div>
                    {loadingSuggestions ? (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      searchSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(suggestion);
                            router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                            setShowSearchSuggestions(false);
                          }}
                          className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded-md text-sm"
                        >
                          {suggestion}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/list"
              className="text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => {
                // 필터 초기화를 위한 새로고침 강제
                window.location.href = "/list";
              }}
            >
              상품 목록
            </Link>
            <Link
              href={user ? "/product/new" : "/auth/login?next=/product/new"}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              상품 등록
            </Link>
            {/* AI 음악 분석 - 임시 비활성화 */}
            {/* <Link
              href="/vocal-analysis"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              AI 음악 분석
            </Link> */}
          </nav>

          {/* 데스크톱 사용자 메뉴 */}
          <div className="hidden md:flex items-center space-x-4">
            <ProfileDropdown />
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden relative">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* 통합 알림 배지 */}
            {(unreadCount > 0 || unreadNotificationCount > 0) && (
              <span className="absolute top-0 right-0 bg-red-500 rounded-full h-2 w-2"></span>
            )}
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            {/* 모바일 검색바 */}
            <div className="px-4 py-4 border-b border-gray-200">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => setShowSearchSuggestions(searchQuery.length > 0)}
                    onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                    placeholder="악기 검색 (예: 중고 기타, 피아노...)"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    검색
                  </button>
                </div>
                
                {/* 모바일 검색 제안 */}
                {showSearchSuggestions && (searchSuggestions.length > 0 || loadingSuggestions) && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
                    <div className="p-2">
                      <div className="text-xs text-gray-500 mb-2 px-2">
                        {loadingSuggestions ? "검색 중..." : "검색 제안"}
                      </div>
                      {loadingSuggestions ? (
                        <div className="flex justify-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchQuery(suggestion);
                              router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                              setShowSearchSuggestions(false);
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded-md text-sm"
                          >
                            {suggestion}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* 사용자 프로필 섹션 */}
            <div className="px-4 py-4 border-b border-gray-200">
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : user ? (
                <div className="flex items-center justify-between">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-3 transition-colors flex-1"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-medium text-gray-600">
                          {user.nickname?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-base font-medium text-gray-700">
                        {user.nickname}
                      </div>
                    </div>
                  </Link>

                  {/* 로그아웃 버튼 */}
                  <button
                    onClick={async () => {
                      if (confirm("로그아웃 하시겠습니까?")) {
                        await logout();
                        setIsMobileMenuOpen(false);
                        window.location.href = "/";
                      }
                    }}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md font-medium transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" size="sm" className="w-full">
                      로그인
                    </Button>
                  </Link>
                </div>
              )}

              {/* 알림 메뉴 - 사용자 프로필 바로 아래 */}
              {user && (
                <div className="px-4 py-2">
                  <button
                    onClick={() =>
                      setIsMobileNotificationOpen(!isMobileNotificationOpen)
                    }
                    className="flex items-center justify-between w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4" />
                      <span>알림</span>
                      {unreadNotificationCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {unreadNotificationCount > 9
                            ? "9+"
                            : unreadNotificationCount}
                        </span>
                      )}
                    </div>
                    {isMobileNotificationOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* 알림 목록 */}
                  {isMobileNotificationOpen && (
                    <div className="px-2 pb-2 max-h-64 overflow-y-auto mt-2">
                      {isLoadingNotifications ? (
                        <div className="px-3 py-4 text-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-xs text-gray-500">
                            알림을 불러오는 중...
                          </p>
                        </div>
                      ) : notifications.length > 0 ? (
                        <>
                          <div className="flex justify-end items-center gap-3 px-2 py-1">
                            <button
                              onClick={async () => {
                                try {
                                  // 모든 읽지 않은 알림을 읽음 처리
                                  const unreadNotifications =
                                    notifications.filter(n => !n.isRead);
                                  await Promise.all(
                                    unreadNotifications.map(n =>
                                      markNotificationAsRead(n.id, user.uid)
                                    )
                                  );
                                  toast.success(
                                    "모든 알림을 읽음 처리했습니다."
                                  );
                                } catch (error) {
                                  console.error("알림 읽음 처리 실패:", error);
                                  toast.error("알림 읽음 처리에 실패했습니다.");
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              모두 읽음
                            </button>
                            <button
                              onClick={handleDeleteAllNotifications}
                              className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              모두 삭제
                            </button>
                          </div>
                          {notifications.map(notification => {
                            // 상태별 색상 매핑
                            const getStatusColor = (status: string) => {
                              switch (status) {
                                case "active":
                                  return "bg-green-100 text-green-800";
                                case "reserved":
                                case "escrow_completed":
                                  return "bg-orange-100 text-orange-800";
                                case "shipping":
                                  return "bg-blue-100 text-blue-800";
                                case "sold":
                                  return "bg-purple-100 text-purple-800";
                                case "cancelled":
                                  return "bg-red-100 text-red-800";
                                default:
                                  return "bg-gray-100 text-gray-800";
                              }
                            };

                            // 알림 메시지 내용으로 실제 상태 추론
                            const getActualStatusFromMessage = (
                              message: string,
                              currentStatus: string
                            ) => {
                              if (!message) return currentStatus;

                              // 취소 관련 메시지들 (최우선 처리)
                              if (
                                message.includes("취소") ||
                                message.includes("거부") ||
                                message.includes("거래가 취소되었습니다") ||
                                message.includes("거래 취소") ||
                                message.includes("요청을 승인했습니다") ||
                                message.includes("요청을 거절했습니다")
                              ) {
                                return "cancelled";
                              }

                              // 거래 완료 메시지들
                              if (
                                message.includes("완료") &&
                                message.includes("거래") &&
                                !message.includes("취소")
                              ) {
                                return "sold";
                              }

                              // 결제 완료 메시지들
                              if (
                                message.includes("안전결제") &&
                                message.includes("완료")
                              ) {
                                return "escrow_completed";
                              }

                              // 거래 시작 메시지들
                              if (
                                message.includes("거래") &&
                                message.includes("시작")
                              ) {
                                return "reserved";
                              }

                              // 판매중으로 변경 메시지들
                              if (
                                message.includes("판매중") ||
                                message.includes("다시 판매")
                              ) {
                                return "active";
                              }

                              // 배송 관련 메시지들 (취소가 아닌 경우에만)
                              if (
                                (message.includes("발송") ||
                                  message.includes("배송")) &&
                                !message.includes("취소")
                              ) {
                                return "shipping";
                              }

                              return currentStatus;
                            };

                            const actualStatus = getActualStatusFromMessage(
                              notification.message,
                              notification.data?.status || "active"
                            );

                            return (
                              <div
                                key={notification.id}
                                className={`flex items-start justify-between px-3 py-2 rounded-lg group cursor-pointer transition-colors ${
                                  notification.isRead
                                    ? "hover:bg-gray-50"
                                    : "bg-blue-50 hover:bg-blue-100"
                                }`}
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                              >
                                <div className="flex-1 pr-2">
                                  <p
                                    className={`text-xs ${
                                      notification.isRead
                                        ? "text-gray-600"
                                        : "text-blue-900 font-medium"
                                    }`}
                                  >
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center space-x-2">
                                      <p className="text-xs text-gray-400">
                                        {notification.createdAt &&
                                          new Date(
                                            notification.createdAt.seconds *
                                              1000
                                          ).toLocaleString("ko-KR", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                      </p>
                                      {/* 상태 태그 표시 - 실제 상태 기반 */}
                                      {actualStatus && (
                                        <span
                                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(actualStatus)}`}
                                        >
                                          {(() => {
                                            const statusLabels: Record<
                                              string,
                                              string
                                            > = {
                                              active: "판매중",
                                              reserved: "거래중",
                                              escrow_completed: "결제완료",
                                              shipping: "배송중",
                                              sold: "거래완료",
                                              cancelled: "거래취소",
                                            };
                                            return (
                                              statusLabels[actualStatus] ||
                                              actualStatus
                                            );
                                          })()}
                                        </span>
                                      )}
                                    </div>
                                    {/* 모바일용 작은 X 버튼 */}
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleDeleteNotification(
                                          notification.id
                                        );
                                      }}
                                      className="md:hidden text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                {/* 데스크톱용 삭제 버튼 */}
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteNotification(notification.id);
                                  }}
                                  className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                >
                                  <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" />
                                </button>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <div className="px-3 py-4 text-center">
                          <p className="text-xs text-gray-500">
                            알림이 없습니다
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 메뉴 항목들 */}
            <div className="px-4 py-3 space-y-1">
              <Link
                href="/list"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  // 필터 초기화를 위한 새로고침 강제
                  window.location.href = "/list";
                }}
              >
                상품 목록
              </Link>
              <Link
                href={user ? "/product/new" : "/auth/login?next=/product/new"}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                상품 등록
              </Link>
              {/* AI 음악 분석 - 임시 비활성화 */}
              {/* <Link
                href="/vocal-analysis"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                AI 음악 분석
              </Link> */}
            </div>

            {/* 프로필 관련 메뉴 */}
            {user && (
              <div className="px-4 py-3 border-t border-gray-200 space-y-1">
                <Link
                  href="/profile/items"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                >
                  내 상품
                </Link>
                <Link
                  href="/profile/transactions"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                >
                  거래내역
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 플로팅 채팅 버튼 */}
      {user && (
        <Link href="/chat" className="fixed bottom-6 right-6 z-50 group">
          <div className="relative">
            <button className="rounded-full shadow-lg bg-blue-600 text-white p-4 hover:bg-blue-700 transition-all transform hover:scale-110 relative z-10">
              <MessageCircle className="w-6 h-6" />
            </button>
            {unreadCount > 0 && (
              <>
                {/* 알록달록 빛나는 테두리 효과 - 버튼 뒤에 배치 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-spin opacity-75 blur-sm -z-10"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 animate-pulse opacity-50 -z-10"></div>
                {/* 메시지 개수 */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce z-20">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </>
            )}
          </div>
        </Link>
      )}
    </header>
  );
}
