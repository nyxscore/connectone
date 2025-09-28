"use client";

import { Button } from "../ui/Button";
import {
  MessageCircle,
  Shield,
  ShoppingCart,
  Clock,
  CheckCircle,
  Search,
  Truck,
  Edit,
  Trash2,
  ArrowUp,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { StartChatButton } from "../chat/StartChatButton";
import { deleteItem, updateItem } from "../../lib/api/products";
import { EditItemModal } from "./EditItemModal";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

interface PurchaseCTAProps {
  status: "active" | "reserved" | "paid_hold" | "shipped" | "sold";
  escrowEnabled: boolean;
  isLoggedIn: boolean;
  itemId?: string;
  sellerUid?: string;
  buyerUid?: string;
  currentUserId?: string; // 현재 로그인한 사용자 ID
  onPurchase?: () => void;
  onChat?: () => void;
  onSimilarItems?: () => void;
  onLogisticsQuote?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBump?: () => void;
}

export function PurchaseCTA({
  status,
  escrowEnabled,
  isLoggedIn,
  itemId,
  sellerUid,
  buyerUid,
  currentUserId,
  onPurchase,
  onChat,
  onSimilarItems,
  onLogisticsQuote,
  onEdit,
  onDelete,
  onBump,
}: PurchaseCTAProps) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showStatusDropdown) {
        const target = event.target as Element;
        if (!target.closest(".status-dropdown")) {
          setShowStatusDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStatusDropdown]);

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase();
    } else {
      // 기본 핸들러 - 실제 구현에서는 결제 로직으로 연결
      console.log("구매하기 클릭");
    }
  };

  const handleChat = () => {
    if (onChat) {
      onChat();
    }
  };

  const handleSimilarItems = () => {
    if (onSimilarItems) {
      onSimilarItems();
    } else {
      // 기본 핸들러 - 비슷한 상품 목록으로 이동
      router.push("/list");
    }
  };

  const handleLogisticsQuote = () => {
    if (onLogisticsQuote) {
      onLogisticsQuote();
    } else {
      // 기본 핸들러 - 실제 구현에서는 운송 견적 모달로 연결
      console.log("운송 견적 받기 클릭");
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      // 기본 핸들러 - 상품 수정 모달 열기
      setShowEditModal(true);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
    } else {
      // 기본 핸들러 - 삭제 확인 후 삭제
      if (
        confirm(
          "정말로 이 상품을 삭제하시겠습니까?\n삭제된 상품은 복구할 수 없습니다."
        )
      ) {
        if (!itemId || !currentUserId) {
          toast.error("삭제할 수 없습니다.");
          return;
        }

        try {
          const result = await deleteItem(itemId, currentUserId);

          if (result.success) {
            toast.success("상품이 삭제되었습니다.");
            // 페이지 새로고침
            window.location.reload();
          } else {
            toast.error(result.error || "상품 삭제에 실패했습니다.");
          }
        } catch (error) {
          console.error("상품 삭제 실패:", error);
          toast.error("상품 삭제 중 오류가 발생했습니다.");
        }
      }
    }
  };

  const handleBump = async () => {
    if (onBump) {
      onBump();
    } else {
      // 기본 핸들러 - 끌어올리기 (updatedAt을 현재 시간으로 업데이트)
      if (!itemId || !currentUserId) {
        toast.error("끌어올릴 수 없습니다.");
        return;
      }

      try {
        // updatedAt만 업데이트하여 끌어올리기 효과
        const result = await updateItem(itemId, currentUserId, {
          updatedAt: new Date(),
        });

        if (result.success) {
          toast.success("상품이 끌어올려졌습니다!");
        } else {
          toast.error(result.error || "끌어올리기에 실패했습니다.");
        }
      } catch (error) {
        console.error("끌어올리기 실패:", error);
        toast.error("끌어올리기 중 오류가 발생했습니다.");
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!itemId || !currentUserId) {
      toast.error("상태를 변경할 수 없습니다.");
      return;
    }

    try {
      const result = await updateItem(itemId, currentUserId, {
        status: newStatus,
        updatedAt: new Date(),
      });

      if (result.success) {
        const statusLabels = {
          active: "판매중",
          reserved: "예약중",
          paid_hold: "결제완료",
          sold: "거래완료",
        };

        toast.success(
          `상품 상태가 "${statusLabels[newStatus as keyof typeof statusLabels]}"로 변경되었습니다!`
        );
        setShowStatusDropdown(false);
        // 페이지 새로고침으로 최신 데이터 반영
        window.location.reload();
      } else {
        toast.error(result.error || "상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("상태 변경 실패:", error);
      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          primaryButton: {
            text: escrowEnabled ? "안전구매하기" : "구매하기",
            icon: escrowEnabled ? Shield : ShoppingCart,
            variant: "primary" as const,
            disabled: false,
            onClick: handlePurchase,
          },
          secondaryButton: {
            text: "채팅으로 문의",
            icon: MessageCircle,
            variant: "outline" as const,
            disabled: false,
            onClick: handleChat,
          },
          tertiaryButton: {
            text: "운송 견적 받기",
            icon: Truck,
            variant: "outline" as const,
            disabled: false,
            onClick: handleLogisticsQuote,
          },
        };
      case "reserved":
        return {
          primaryButton: {
            text: "거래중 · 예약중",
            icon: Clock,
            variant: "outline" as const,
            disabled: true,
            onClick: () => {},
          },
          secondaryButton: null,
        };
      case "paid_hold":
        return {
          primaryButton: {
            text: "결제완료 · 대기",
            icon: CheckCircle,
            variant: "outline" as const,
            disabled: true,
            onClick: () => {},
          },
          secondaryButton: null,
        };
      case "shipped":
        return {
          primaryButton: {
            text: "운송 진행중",
            icon: Clock,
            variant: "outline" as const,
            disabled: true,
            onClick: () => {},
          },
          secondaryButton: null,
        };
      case "sold":
        return {
          primaryButton: {
            text: "거래완료",
            icon: CheckCircle,
            variant: "outline" as const,
            disabled: true,
            onClick: () => {},
          },
          secondaryButton: {
            text: "비슷한 매물 보기",
            icon: Search,
            variant: "primary" as const,
            disabled: false,
            onClick: handleSimilarItems,
          },
        };
      default:
        return {
          primaryButton: {
            text: "상태 불명",
            icon: Clock,
            variant: "outline" as const,
            disabled: true,
            onClick: () => {},
          },
          secondaryButton: null,
        };
    }
  };

  const config = getStatusConfig();
  const PrimaryIcon = config.primaryButton.icon;
  const SecondaryIcon = config.secondaryButton?.icon;
  const TertiaryIcon = (config as any).tertiaryButton?.icon;

  // 자신이 작성한 글인지 확인
  const isOwnItem = currentUserId && sellerUid && currentUserId === sellerUid;

  // 디버깅 로그
  console.log("PurchaseCTA 디버깅:", {
    currentUserId,
    sellerUid,
    isOwnItem,
    status,
    itemId,
  });

  return (
    <div className="space-y-4">
      {/* 자신의 글인 경우 */}
      {isOwnItem ? (
        <div className="space-y-4">
          {/* 거래 상태 섹션 */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  거래상태
                </h3>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      status === "active"
                        ? "bg-green-500"
                        : status === "reserved"
                          ? "bg-yellow-500"
                          : status === "paid_hold"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                    }`}
                  ></div>
                  <span className="text-lg font-semibold text-gray-900">
                    {status === "active" && "판매중"}
                    {status === "reserved" && "예약중"}
                    {status === "paid_hold" && "결제완료"}
                    {status === "sold" && "거래완료"}
                  </span>
                </div>
              </div>
              {/* 상태 변경 드롭다운 */}
              <div className="relative status-dropdown">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="p-2 hover:bg-gray-100"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {showStatusDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      {status !== "active" && (
                        <button
                          onClick={() => handleStatusChange("active")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>판매중</span>
                        </button>
                      )}
                      {status !== "reserved" && (
                        <button
                          onClick={() => handleStatusChange("reserved")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span>예약중</span>
                        </button>
                      )}
                      {status !== "paid_hold" && (
                        <button
                          onClick={() => handleStatusChange("paid_hold")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>결제완료</span>
                        </button>
                      )}
                      {status !== "sold" && (
                        <button
                          onClick={() => handleStatusChange("sold")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          <span>거래완료</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 상품 관리 섹션 */}
          <div className="bg-white rounded-lg p-4 border">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              상품 관리
            </h3>

            {/* 관리 버튼들 */}
            <div className="grid grid-cols-1 gap-3">
              {status === "active" && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleEdit}
                    className="w-full"
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    상품 수정
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleBump}
                      className="w-full"
                    >
                      <ArrowUp className="w-5 h-5 mr-2" />
                      끌어올리기
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleDelete}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      삭제
                    </Button>
                  </div>
                </>
              )}

              {/* 예약중 상태 */}
              {status === "reserved" && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleEdit}
                    className="w-full"
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    상품 수정
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleBump}
                    className="w-full"
                  >
                    <ArrowUp className="w-5 h-5 mr-2" />
                    끌어올리기
                  </Button>
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500">
                      예약된 상품은 삭제할 수 없습니다
                    </p>
                  </div>
                </>
              )}

              {/* 결제완료/배송중 상태 */}
              {(status === "paid_hold" || status === "shipped") && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleEdit}
                    className="w-full"
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    상품 수정
                  </Button>
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500">
                      거래 진행 중인 상품은 끌어올리기/삭제할 수 없습니다
                    </p>
                  </div>
                </>
              )}

              {/* 거래완료 상태 */}
              {status === "sold" && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    거래 완료된 상품은 수정할 수 없습니다
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 다른 사람의 글인 경우 - 기존 UI */
        <>
          {/* 메인 버튼들 */}
          <div className="flex space-x-4">
            <Button
              className={`flex-1 ${
                escrowEnabled && status === "active"
                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  : ""
              }`}
              size="lg"
              variant={config.primaryButton.variant}
              disabled={config.primaryButton.disabled}
              onClick={config.primaryButton.onClick}
            >
              <PrimaryIcon className="w-5 h-5 mr-2" />
              {config.primaryButton.text}
              {escrowEnabled && status === "active" && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                  보장
                </span>
              )}
            </Button>

            {config.secondaryButton && (
              <div className="flex-1">
                {itemId && sellerUid ? (
                  <StartChatButton
                    itemId={itemId}
                    sellerUid={sellerUid}
                    className="w-full h-12"
                  />
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    variant={config.secondaryButton.variant}
                    disabled={config.secondaryButton.disabled}
                    onClick={config.secondaryButton.onClick}
                  >
                    {SecondaryIcon && (
                      <SecondaryIcon className="w-5 h-5 mr-2" />
                    )}
                    {config.secondaryButton.text}
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* 운송 견적 버튼 - 다른 사람의 글일 때만 표시 */}
      {(config as any).tertiaryButton && !isOwnItem && (
        <div className="flex justify-center">
          <Button
            size="lg"
            variant={(config as any).tertiaryButton.variant}
            disabled={(config as any).tertiaryButton.disabled}
            onClick={(config as any).tertiaryButton.onClick}
            className="w-full max-w-md"
          >
            <TertiaryIcon className="w-5 h-5 mr-2" />
            {(config as any).tertiaryButton.text}
          </Button>
        </div>
      )}

      {/* 로그인 안내 */}
      {!isLoggedIn && status === "active" && (
        <p className="text-sm text-gray-500 text-center">
          구매나 채팅을 하려면{" "}
          <button
            className="text-blue-600 hover:underline"
            onClick={() => router.push("/auth/login")}
          >
            로그인
          </button>
          이 필요합니다
        </p>
      )}

      {/* 상태별 안내 메시지 */}
      {status !== "active" && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {status === "reserved" && "이 상품은 현재 예약 중입니다."}
            {status === "paid_hold" && "결제가 완료되어 배송 준비 중입니다."}
            {status === "shipped" && "상품이 배송 중입니다."}
            {status === "sold" && "이 상품은 이미 판매되었습니다."}
          </p>
        </div>
      )}

      {/* 상품 수정 모달 */}
      {itemId && (
        <EditItemModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          itemId={itemId}
          onItemUpdated={() => {
            // 상품이 수정되면 페이지 새로고침 또는 상태 업데이트
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
