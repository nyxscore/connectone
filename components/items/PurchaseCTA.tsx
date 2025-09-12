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
}: PurchaseCTAProps) {
  const router = useRouter();

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

  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          primaryButton: {
            text: escrowEnabled ? "안전결제로 구매" : "구매하기",
            icon: escrowEnabled ? Shield : ShoppingCart,
            variant: "default" as const,
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
            variant: "default" as const,
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

  return (
    <div className="space-y-4">
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

        {config.secondaryButton && !isOwnItem && (
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
                <SecondaryIcon className="w-5 h-5 mr-2" />
                {config.secondaryButton.text}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 운송 견적 버튼 */}
      {(config as any).tertiaryButton && (
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
    </div>
  );
}
