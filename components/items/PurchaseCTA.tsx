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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { StartChatButton } from "../chat/StartChatButton";
import { deleteItem, updateItem } from "../../lib/api/products";
import { EditItemModal } from "./EditItemModal";
import { DeletedItemModal } from "./DeletedItemModal";
import toast from "react-hot-toast";
import { useState } from "react";

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
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [deletedItemTitle, setDeletedItemTitle] = useState("");

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
            // 삭제된 상품 제목 설정 (실제로는 상품 정보를 가져와야 하지만, 간단히 처리)
            setDeletedItemTitle("상품");
            // 삭제 완료 모달 표시
            setShowDeletedModal(true);
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

  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          primaryButton: {
            text: escrowEnabled ? "안전결제로 구매" : "구매하기",
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
        <div className="space-y-3">
          {/* 상태 표시 */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {status === "active" && "내가 등록한 상품"}
              {status === "reserved" && "예약 중인 상품"}
              {status === "paid_hold" && "결제 완료된 상품"}
              {status === "shipped" && "배송 중인 상품"}
              {status === "sold" && "판매 완료된 상품"}
            </p>
          </div>

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

            {status !== "active" && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  {status === "reserved" && "예약된 상품은 수정할 수 없습니다."}
                  {status === "paid_hold" &&
                    "결제 완료된 상품은 수정할 수 없습니다."}
                  {status === "shipped" &&
                    "배송 중인 상품은 수정할 수 없습니다."}
                  {status === "sold" && "판매 완료된 상품입니다."}
                </p>
              </div>
            )}
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

      {/* 상품 삭제 완료 모달 */}
      <DeletedItemModal
        isOpen={showDeletedModal}
        onClose={() => setShowDeletedModal(false)}
        itemTitle={deletedItemTitle}
      />
    </div>
  );
}
