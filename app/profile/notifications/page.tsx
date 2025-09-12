"use client";

import { ProtectedRoute } from "../../../lib/auth/ProtectedRoute";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { useState, useEffect } from "react";
import { useAuth } from "../../../lib/auth/useAuth";
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle,
  XCircle,
  Settings,
  Save,
} from "lucide-react";

interface NotificationSettings {
  emailNotifications: {
    newMessage: boolean;
    transactionUpdate: boolean;
    logisticsQuote: boolean;
    questionAnswer: boolean;
    paymentStatus: boolean;
    productInterest: boolean;
    systemAnnouncement: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    newMessage: boolean;
    transactionUpdate: boolean;
    logisticsQuote: boolean;
    questionAnswer: boolean;
    paymentStatus: boolean;
    productInterest: boolean;
    systemAnnouncement: boolean;
  };
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: {
      newMessage: true,
      transactionUpdate: true,
      logisticsQuote: true,
      questionAnswer: true,
      paymentStatus: true,
      productInterest: false,
      systemAnnouncement: true,
    },
    pushNotifications: {
      enabled: false,
      newMessage: false,
      transactionUpdate: false,
      logisticsQuote: false,
      questionAnswer: false,
      paymentStatus: false,
      productInterest: false,
      systemAnnouncement: false,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // 실제로는 API에서 사용자 설정 조회
      // 여기서는 Mock 데이터 사용
      const mockSettings: NotificationSettings = {
        emailNotifications: {
          newMessage: true,
          transactionUpdate: true,
          logisticsQuote: true,
          questionAnswer: true,
          paymentStatus: true,
          productInterest: false,
          systemAnnouncement: true,
        },
        pushNotifications: {
          enabled: false,
          newMessage: false,
          transactionUpdate: false,
          logisticsQuote: false,
          questionAnswer: false,
          paymentStatus: false,
          productInterest: false,
          systemAnnouncement: false,
        },
      };
      setSettings(mockSettings);
    } catch (error) {
      console.error("설정 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSettingChange = (
    key: keyof NotificationSettings["emailNotifications"]
  ) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: !prev.emailNotifications[key],
      },
    }));
  };

  const handlePushSettingChange = (
    key: keyof NotificationSettings["pushNotifications"]
  ) => {
    setSettings(prev => ({
      ...prev,
      pushNotifications: {
        ...prev.pushNotifications,
        [key]: !prev.pushNotifications[key],
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 실제로는 API에 설정 저장
      console.log("설정 저장:", settings);

      // Mock: 저장 성공
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage("설정이 저장되었습니다.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("설정 저장 오류:", error);
      setMessage("설정 저장에 실패했습니다.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const emailSettings = [
    {
      key: "newMessage" as const,
      label: "새 메시지",
      description: "채팅 메시지가 도착했을 때",
      icon: <Mail className="w-5 h-5" />,
    },
    {
      key: "transactionUpdate" as const,
      label: "거래 상태 업데이트",
      description: "거래 진행 상황이 변경되었을 때",
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      key: "logisticsQuote" as const,
      label: "운송 견적",
      description: "운송 견적이 준비되었을 때",
      icon: <Settings className="w-5 h-5" />,
    },
    {
      key: "questionAnswer" as const,
      label: "질문 답변",
      description: "상품 질문에 답변이 달렸을 때",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      key: "paymentStatus" as const,
      label: "결제 상태",
      description: "결제 상태가 변경되었을 때",
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      key: "productInterest" as const,
      label: "상품 관심사",
      description: "관심 상품의 가격 변동, 새 상품 등",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      key: "systemAnnouncement" as const,
      label: "시스템 공지",
      description: "중요한 시스템 공지사항",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const pushSettings = [
    {
      key: "newMessage" as const,
      label: "새 메시지",
      description: "채팅 메시지가 도착했을 때",
    },
    {
      key: "transactionUpdate" as const,
      label: "거래 상태 업데이트",
      description: "거래 진행 상황이 변경되었을 때",
    },
    {
      key: "logisticsQuote" as const,
      label: "운송 견적",
      description: "운송 견적이 준비되었을 때",
    },
    {
      key: "questionAnswer" as const,
      label: "질문 답변",
      description: "상품 질문에 답변이 달렸을 때",
    },
    {
      key: "paymentStatus" as const,
      label: "결제 상태",
      description: "결제 상태가 변경되었을 때",
    },
    {
      key: "productInterest" as const,
      label: "상품 관심사",
      description: "관심 상품의 가격 변동, 새 상품 등",
    },
    {
      key: "systemAnnouncement" as const,
      label: "시스템 공지",
      description: "중요한 시스템 공지사항",
    },
  ];

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">설정을 불러오는 중...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Bell className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
              </div>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.includes("성공")
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* 이메일 알림 설정 */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  이메일 알림
                </h2>
              </div>
              <p className="text-gray-600">이메일로 받을 알림을 선택하세요.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailSettings.map(setting => (
                  <div
                    key={setting.key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-600">{setting.icon}</div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {setting.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEmailSettingChange(setting.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.emailNotifications[setting.key]
                          ? "bg-blue-600"
                          : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.emailNotifications[setting.key]
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 푸시 알림 설정 */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Smartphone className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  푸시 알림
                </h2>
              </div>
              <p className="text-gray-600">
                모바일에서 받을 푸시 알림을 선택하세요.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 푸시 알림 전체 설정 */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        푸시 알림 활성화
                      </h3>
                      <p className="text-sm text-gray-600">
                        모든 푸시 알림을 켜거나 끌 수 있습니다.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePushSettingChange("enabled")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.pushNotifications.enabled
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.pushNotifications.enabled
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* 개별 푸시 알림 설정 */}
                {pushSettings.map(setting => (
                  <div
                    key={setting.key}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      settings.pushNotifications.enabled
                        ? "bg-gray-50"
                        : "bg-gray-100 opacity-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-600">
                        {settings.pushNotifications.enabled ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {setting.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePushSettingChange(setting.key)}
                      disabled={!settings.pushNotifications.enabled}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.pushNotifications[setting.key] &&
                        settings.pushNotifications.enabled
                          ? "bg-blue-600"
                          : "bg-gray-200"
                      } ${!settings.pushNotifications.enabled ? "cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.pushNotifications[setting.key] &&
                          settings.pushNotifications.enabled
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PWA 안내 */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">PWA 지원</h2>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  <strong>PWA 지원 예정:</strong> 웹푸시 알림과 오프라인 지원을
                  위한 PWA 기능이 준비 중입니다. PWA 도입 후 푸시 알림을 더
                  효율적으로 받을 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

