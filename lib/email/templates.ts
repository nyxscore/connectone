import { EmailTemplate } from "../../data/types";

// 이메일 템플릿 정의
export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  new_message: {
    id: "new_message",
    name: "신규 메시지 알림",
    subject: "ConnecTone - 새로운 메시지가 도착했습니다",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>새로운 메시지</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 40px 20px; }
          .message-card { background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; border-left: 4px solid #667eea; }
          .sender-info { display: flex; align-items: center; margin-bottom: 16px; }
          .sender-avatar { width: 48px; height: 48px; border-radius: 50%; background-color: #667eea; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; margin-right: 16px; }
          .sender-details h3 { margin: 0; color: #1a202c; font-size: 18px; }
          .sender-details p { margin: 4px 0 0 0; color: #718096; font-size: 14px; }
          .message-preview { color: #4a5568; font-size: 16px; line-height: 1.6; margin: 16px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
          .footer { background-color: #f7fafc; padding: 24px 20px; text-align: center; color: #718096; font-size: 14px; }
          .footer a { color: #667eea; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎵 ConnecTone</h1>
          </div>
          <div class="content">
            <h2 style="color: #1a202c; margin-bottom: 24px;">새로운 메시지가 도착했습니다!</h2>
            
            <div class="message-card">
              <div class="sender-info">
                <div class="sender-avatar">{{senderInitial}}</div>
                <div class="sender-details">
                  <h3>{{senderName}}</h3>
                  <p>{{productTitle}}</p>
                </div>
              </div>
              <div class="message-preview">
                "{{messagePreview}}"
              </div>
            </div>
            
            <p style="color: #4a5568; margin: 24px 0;">
              {{senderName}}님이 {{productTitle}} 상품에 대해 메시지를 보냈습니다. 
              빠른 답변으로 좋은 거래를 만들어보세요!
            </p>
            
            <div style="text-align: center;">
              <a href="{{chatUrl}}" class="cta-button">메시지 확인하기</a>
            </div>
          </div>
          <div class="footer">
            <p>이 이메일은 ConnecTone에서 자동으로 발송되었습니다.</p>
            <p><a href="{{unsubscribeUrl}}">알림 설정 변경</a> | <a href="{{supportUrl}}">고객지원</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      ConnecTone - 새로운 메시지가 도착했습니다!
      
      안녕하세요!
      
      {{senderName}}님이 {{productTitle}} 상품에 대해 메시지를 보냈습니다.
      
      메시지 내용: "{{messagePreview}}"
      
      빠른 답변으로 좋은 거래를 만들어보세요!
      
      메시지 확인하기: {{chatUrl}}
      
      ---
      ConnecTone
      이 이메일은 자동으로 발송되었습니다.
      알림 설정: {{unsubscribeUrl}}
    `,
    variables: [
      "senderName",
      "senderInitial",
      "productTitle",
      "messagePreview",
      "chatUrl",
      "unsubscribeUrl",
      "supportUrl",
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  transaction_update: {
    id: "transaction_update",
    name: "거래 진행 알림",
    subject: "ConnecTone - 거래 상태가 업데이트되었습니다",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>거래 상태 업데이트</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 40px 20px; }
          .status-card { background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; border-left: 4px solid {{statusColor}}; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 16px; background-color: {{statusColor}}; color: white; }
          .product-info { display: flex; align-items: center; margin: 20px 0; }
          .product-image { width: 80px; height: 80px; border-radius: 8px; background-color: #e2e8f0; margin-right: 16px; }
          .product-details h3 { margin: 0; color: #1a202c; font-size: 18px; }
          .product-details p { margin: 4px 0 0 0; color: #718096; font-size: 14px; }
          .transaction-details { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .detail-label { color: #718096; font-size: 14px; }
          .detail-value { color: #1a202c; font-weight: 600; font-size: 14px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
          .footer { background-color: #f7fafc; padding: 24px 20px; text-align: center; color: #718096; font-size: 14px; }
          .footer a { color: #667eea; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎵 ConnecTone</h1>
          </div>
          <div class="content">
            <h2 style="color: #1a202c; margin-bottom: 24px;">거래 상태가 업데이트되었습니다</h2>
            
            <div class="status-card">
              <div class="status-badge">{{statusLabel}}</div>
              <p style="color: #4a5568; margin: 16px 0;">{{statusDescription}}</p>
            </div>
            
            <div class="product-info">
              <div class="product-image"></div>
              <div class="product-details">
                <h3>{{productTitle}}</h3>
                <p>{{productBrand}} {{productModel}}</p>
              </div>
            </div>
            
            <div class="transaction-details">
              <div class="detail-row">
                <span class="detail-label">거래 금액</span>
                <span class="detail-value">{{amount}}원</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">거래 상대</span>
                <span class="detail-value">{{counterpartName}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">업데이트 시간</span>
                <span class="detail-value">{{updatedAt}}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="{{transactionUrl}}" class="cta-button">거래 상세보기</a>
            </div>
          </div>
          <div class="footer">
            <p>이 이메일은 ConnecTone에서 자동으로 발송되었습니다.</p>
            <p><a href="{{unsubscribeUrl}}">알림 설정 변경</a> | <a href="{{supportUrl}}">고객지원</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      ConnecTone - 거래 상태가 업데이트되었습니다
      
      안녕하세요!
      
      거래 상태가 업데이트되었습니다.
      
      상품: {{productTitle}} ({{productBrand}} {{productModel}})
      거래 금액: {{amount}}원
      거래 상대: {{counterpartName}}
      상태: {{statusLabel}}
      
      {{statusDescription}}
      
      거래 상세보기: {{transactionUrl}}
      
      ---
      ConnecTone
      이 이메일은 자동으로 발송되었습니다.
      알림 설정: {{unsubscribeUrl}}
    `,
    variables: [
      "statusLabel",
      "statusDescription",
      "statusColor",
      "productTitle",
      "productBrand",
      "productModel",
      "amount",
      "counterpartName",
      "updatedAt",
      "transactionUrl",
      "unsubscribeUrl",
      "supportUrl",
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  logistics_quote: {
    id: "logistics_quote",
    name: "운송 견적 알림",
    subject: "ConnecTone - 운송 견적이 준비되었습니다",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>운송 견적</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 40px 20px; }
          .quote-card { background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; border-left: 4px solid #10b981; }
          .price-highlight { text-align: center; margin: 24px 0; }
          .price { font-size: 36px; font-weight: 700; color: #10b981; margin: 0; }
          .price-label { color: #718096; font-size: 14px; margin-top: 8px; }
          .route-info { display: flex; justify-content: space-between; margin: 20px 0; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; }
          .route-item { text-align: center; }
          .route-label { color: #718096; font-size: 12px; margin-bottom: 8px; }
          .route-value { color: #1a202c; font-weight: 600; font-size: 16px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
          .detail-item { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
          .detail-label { color: #718096; font-size: 12px; margin-bottom: 4px; }
          .detail-value { color: #1a202c; font-weight: 600; font-size: 14px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
          .footer { background-color: #f7fafc; padding: 24px 20px; text-align: center; color: #718096; font-size: 14px; }
          .footer a { color: #667eea; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎵 ConnecTone</h1>
          </div>
          <div class="content">
            <h2 style="color: #1a202c; margin-bottom: 24px;">운송 견적이 준비되었습니다!</h2>
            
            <div class="quote-card">
              <div class="price-highlight">
                <p class="price">{{estimatedPrice}}원</p>
                <p class="price-label">예상 운송비</p>
              </div>
              
              <div class="route-info">
                <div class="route-item">
                  <div class="route-label">출발지</div>
                  <div class="route-value">{{fromAddress}}</div>
                </div>
                <div class="route-item">
                  <div class="route-label">도착지</div>
                  <div class="route-value">{{toAddress}}</div>
                </div>
              </div>
              
              <div class="details-grid">
                <div class="detail-item">
                  <div class="detail-label">예상 소요시간</div>
                  <div class="detail-value">{{estimatedDays}}일</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">보험 포함</div>
                  <div class="detail-value">{{insuranceIncluded}}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">운송업체</div>
                  <div class="detail-value">{{carrierName}}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">서비스 유형</div>
                  <div class="detail-value">{{serviceType}}</div>
                </div>
              </div>
            </div>
            
            <p style="color: #4a5568; margin: 24px 0;">
              {{productTitle}} 상품의 운송 견적이 준비되었습니다. 
              견적을 확인하고 운송을 주문해보세요!
            </p>
            
            <div style="text-align: center;">
              <a href="{{quoteUrl}}" class="cta-button">견적 확인하기</a>
            </div>
          </div>
          <div class="footer">
            <p>이 이메일은 ConnecTone에서 자동으로 발송되었습니다.</p>
            <p><a href="{{unsubscribeUrl}}">알림 설정 변경</a> | <a href="{{supportUrl}}">고객지원</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      ConnecTone - 운송 견적이 준비되었습니다
      
      안녕하세요!
      
      {{productTitle}} 상품의 운송 견적이 준비되었습니다.
      
      예상 운송비: {{estimatedPrice}}원
      출발지: {{fromAddress}}
      도착지: {{toAddress}}
      예상 소요시간: {{estimatedDays}}일
      보험 포함: {{insuranceIncluded}}
      운송업체: {{carrierName}}
      서비스 유형: {{serviceType}}
      
      견적을 확인하고 운송을 주문해보세요!
      
      견적 확인하기: {{quoteUrl}}
      
      ---
      ConnecTone
      이 이메일은 자동으로 발송되었습니다.
      알림 설정: {{unsubscribeUrl}}
    `,
    variables: [
      "productTitle",
      "estimatedPrice",
      "fromAddress",
      "toAddress",
      "estimatedDays",
      "insuranceIncluded",
      "carrierName",
      "serviceType",
      "quoteUrl",
      "unsubscribeUrl",
      "supportUrl",
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// 상태별 색상 매핑
export const STATUS_COLORS = {
  pending: "#f59e0b",
  paid_hold: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  released: "#059669",
  refunded: "#ef4444",
  cancelled: "#6b7280",
};

// 상태별 라벨 매핑
export const STATUS_LABELS = {
  pending: "결제 대기",
  paid_hold: "결제 완료 (보류)",
  shipped: "배송 중",
  delivered: "배송 완료",
  released: "거래 완료",
  refunded: "환불 완료",
  cancelled: "거래 취소",
};

// 상태별 설명 매핑
export const STATUS_DESCRIPTIONS = {
  pending: "구매자가 결제를 진행 중입니다.",
  paid_hold: "결제가 완료되었고 안전하게 보관되고 있습니다.",
  shipped: "상품이 배송 중입니다. 배송 추적이 가능합니다.",
  delivered: "상품이 안전하게 배송되었습니다.",
  released: "거래가 성공적으로 완료되었습니다.",
  refunded: "거래가 취소되어 환불이 처리되었습니다.",
  cancelled: "거래가 취소되었습니다.",
};
















