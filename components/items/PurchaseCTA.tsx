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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { StartChatButton } from "../chat/StartChatButton";
import toast from "react-hot-toast";

interface PurchaseCTAProps {
  status:
    | "active"
    | "reserved"
    | "paid_hold"
    | "shipped"
    | "sold"
    | "escrow_completed";
  escrowEnabled: boolean;
  isLoggedIn: boolean;
  itemId?: string;
  sellerUid?: string;
  buyerUid?: string;
  currentUserId?: string;
  onPurchase?: () => void;
  onChat?: () => void;
  onSimilarItems?: () => void;
  onLogisticsQuote?: () => void;
  onStartTransaction?: () => void;
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
  onStartTransaction,
}: PurchaseCTAProps) {
  const router = useRouter();

  const handlePurchase = async () => {
    if (escrowEnabled && itemId) {
      router.push(`/payment?itemId=${itemId}&escrow=true`);
    } else if (onPurchase) {
      onPurchase();
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
      router.push("/list");
    }
  };

  const handleLogisticsQuote = () => {
    if (onLogisticsQuote) {
      onLogisticsQuote();
    } else {
      toast.success("운송 견적 요청이 접수되었습니다!");
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
            text: "운송 견적 받기",
            icon: Truck,
            variant: "outline" as const,
            disabled: false,
            onClick: handleLogisticsQuote,
          },
        };
      case "reserved":
        return {
          secondaryButton: {
            text: "거래중 · 예약중",
            icon: Clock,
            variant: "outline" as const,
            disabled: true,
            onClick: () => {},
          },
        };
      case "paid_hold":
        return {
          secondaryButton: {
            text: "결제완료 · 대기",
            icon: CheckCircle,
            variant: "outline" as const,
            disabled: true,
            onClick: () => {},
          },
        };
      case "shipped":
        return {
          secondaryButton: {
            text: "운송 진행중",
            icon: Clock,
            variant: "outline" as const,
            disabled: true,
            onClick: () => {},
          },
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
      case "escrow_completed":
        if (sellerUid === currentUserId) {
          return {
            primaryButton: {
              text: "거래 진행하기",
              icon: CheckCircle,
              variant: "primary" as const,
              disabled: false,
              onClick: onStartTransaction || (() => {}),
            },
            secondaryButton: {
              text: "거래 상대방과 채팅",
              icon: MessageCircle,
              variant: "outline" as const,
              disabled: false,
              onClick: handleChat,
            },
          };
        } else {
          return {
            secondaryButton: {
              text: "안전결제 완료",
              icon: Shield,
              variant: "outline" as const,
              disabled: true,
              onClick: () => {},
            },
          };
        }
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
  const PrimaryIcon = config.primaryButton?.icon;
  const SecondaryIcon = config.secondaryButton?.icon;

  const isOwnItem = currentUserId && sellerUid && currentUserId === sellerUid;

  return (
    <div className="space-y-4">
      {/* 구매자/다른 사람의 글인 경우만 표시 */}
      {!isOwnItem && (
        <>
          {/* 메인 버튼들 */}
          <div className="flex space-x-4">
            {config.primaryButton && (
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
                {PrimaryIcon && <PrimaryIcon className="w-5 h-5 mr-2" />}
                {config.primaryButton.text}
                {escrowEnabled && status === "active" && (
                  <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                    보장
                  </span>
                )}
              </Button>
            )}

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
                    size="lg"
                    variant={config.secondaryButton.variant}
                    disabled={config.secondaryButton.disabled}
                    onClick={config.secondaryButton.onClick}
                    className="w-full h-12"
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

          {/* 상태 안내 메시지 */}
          {(status === "paid_hold" ||
            status === "shipped" ||
            status === "sold") && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">
                {status === "paid_hold" &&
                  "결제가 완료되어 배송 준비 중입니다."}
                {status === "shipped" && "상품이 배송 중입니다."}
                {status === "sold" && "이 상품은 이미 판매되었습니다."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
