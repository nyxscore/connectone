import { NextRequest, NextResponse } from "next/server";
import { getFirebaseDb as getDb } from "@/lib/api/firebase-ultra-safe";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { feedbackId } = await req.json();

    if (!feedbackId) {
      return NextResponse.json(
        { error: "피드백 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // Firestore에서 피드백 데이터 가져오기
    const db = await getDb();
    const feedbackRef = doc(db, "expert_analysis_requests", feedbackId);
    const feedbackDoc = await getDoc(feedbackRef);

    if (!feedbackDoc.exists()) {
      return NextResponse.json(
        { error: "피드백을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const feedback = feedbackDoc.data();

    // HTML을 PDF로 변환 (간단한 방법)
    // 실제 프로덕션에서는 puppeteer나 PDFKit 사용 권장
    const htmlContent = generateFeedbackHTML(feedback);

    // 여기서는 HTML을 반환하고, 클라이언트에서 변환
    // 실제로는 서버에서 PDF를 생성하는 것이 좋음
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("PDF 생성 오류:", error);
    return NextResponse.json(
      { error: "PDF 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

function generateFeedbackHTML(feedback: any): string {
  const overallScore = feedback.analysisResult?.overallScore || 0;
  const strengths = feedback.analysisResult?.strengths || [];
  const improvements = feedback.analysisResult?.improvements || [];
  const detailedComments = feedback.analysisResult?.detailedComments || "";
  const recommendations = feedback.analysisResult?.recommendations || [];
  const scoreBreakdown = feedback.analysisResult?.scoreBreakdown || {};

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ConnecTone 전문가 피드백 리포트</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Sans KR', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 40px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      border-bottom: 4px solid #8b5cf6;
      padding-bottom: 30px;
      margin-bottom: 40px;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 900;
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }
    
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    
    .info-item {
      font-size: 14px;
    }
    
    .info-label {
      color: #6b7280;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-weight: 700;
      color: #1f2937;
    }
    
    .score-section {
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .overall-score {
      font-size: 72px;
      font-weight: 900;
      margin-bottom: 10px;
    }
    
    .stars {
      font-size: 24px;
      margin-top: 10px;
    }
    
    .section {
      margin-bottom: 30px;
      background: white;
      padding: 25px;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .strength-title { color: #10b981; }
    .improvement-title { color: #f59e0b; }
    .comment-title { color: #8b5cf6; }
    .recommendation-title { color: #3b82f6; }
    
    .list-item {
      display: flex;
      gap: 12px;
      margin-bottom: 15px;
      align-items: flex-start;
    }
    
    .list-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .strength-number { background: #d1fae5; color: #10b981; }
    .improvement-number { background: #fef3c7; color: #f59e0b; }
    .recommendation-number { background: #dbeafe; color: #3b82f6; }
    
    .comment-box {
      background: #faf5ff;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #8b5cf6;
      white-space: pre-line;
    }
    
    .score-breakdown {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .score-item {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
    }
    
    .score-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .score-value {
      font-size: 32px;
      font-weight: 900;
      color: #8b5cf6;
    }
    
    .score-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    
    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #8b5cf6, #ec4899);
      border-radius: 4px;
    }
    
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
      margin-top: 40px;
      color: #6b7280;
      font-size: 12px;
    }
    
    .watermark {
      position: fixed;
      bottom: 20px;
      right: 20px;
      opacity: 0.1;
      font-size: 48px;
      font-weight: 900;
      color: #8b5cf6;
      transform: rotate(-45deg);
      pointer-events: none;
    }
    
    @media print {
      body { padding: 20px; }
      .watermark { opacity: 0.05; }
    }
  </style>
</head>
<body>
  <div class="watermark">ConnecTone</div>
  
  <div class="container">
    <!-- 헤더 -->
    <div class="header">
      <div class="logo">🎵 ConnecTone</div>
      <div class="title">전문가 피드백 리포트</div>
      <p style="color: #6b7280; font-size: 14px;">Professional Music Analysis Report</p>
    </div>
    
    <!-- 기본 정보 -->
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">회원님</div>
        <div class="info-value">${feedback.userNickname}</div>
      </div>
      <div class="info-item">
        <div class="info-label">분석 분야</div>
        <div class="info-value">${feedback.analysisCategory}</div>
      </div>
      <div class="info-item">
        <div class="info-label">전문가</div>
        <div class="info-value">${feedback.expertName || "전문가"} ${feedback.expertTitle ? `(${feedback.expertTitle})` : ""}</div>
      </div>
      <div class="info-item">
        <div class="info-label">분석 완료일</div>
        <div class="info-value">${new Date(feedback.completedAt?.toDate?.() || new Date()).toLocaleDateString("ko-KR")}</div>
      </div>
    </div>
    
    <!-- 종합 평가 -->
    <div class="score-section">
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 15px;">종합 평가</div>
      <div class="overall-score">${overallScore} <span style="font-size: 36px; opacity: 0.8;">/ 100</span></div>
      <div class="stars">${"⭐".repeat(Math.round(overallScore / 20))}${"☆".repeat(5 - Math.round(overallScore / 20))}</div>
    </div>
    
    <!-- 세부 점수 -->
    <div class="section">
      <div class="section-title">📊 세부 평가</div>
      <div class="score-breakdown">
        ${Object.entries(scoreBreakdown)
          .map(([key, score]: [string, any]) => {
            const labels: { [key: string]: string } = {
              pitch: "음정 정확도",
              rhythm: "리듬 안정성",
              expression: "표현력",
              technique: "테크닉",
            };
            return `
                <div class="score-item">
                  <div class="score-label">${labels[key]}</div>
                  <div class="score-value">${score}</div>
                  <div class="score-bar">
                    <div class="score-fill" style="width: ${score}%"></div>
                  </div>
                </div>
              `;
          })
          .join("")}
      </div>
    </div>
    
    <!-- 강점 -->
    <div class="section">
      <div class="section-title strength-title">✅ 강점</div>
      ${strengths
        .map(
          (strength: string, index: number) => `
        <div class="list-item">
          <div class="list-number strength-number">${index + 1}</div>
          <div>${strength}</div>
        </div>
      `
        )
        .join("")}
    </div>
    
    <!-- 개선점 -->
    <div class="section">
      <div class="section-title improvement-title">📈 개선점</div>
      ${improvements
        .map(
          (improvement: string, index: number) => `
        <div class="list-item">
          <div class="list-number improvement-number">${index + 1}</div>
          <div>${improvement}</div>
        </div>
      `
        )
        .join("")}
    </div>
    
    <!-- 전문가 코멘트 -->
    <div class="section">
      <div class="section-title comment-title">💬 전문가 상세 코멘트</div>
      <div class="comment-box">${detailedComments}</div>
    </div>
    
    <!-- 추천 연습법 -->
    <div class="section">
      <div class="section-title recommendation-title">📚 추천 연습법</div>
      ${recommendations
        .map(
          (rec: string, index: number) => `
        <div class="list-item">
          <div class="list-number recommendation-number">${index + 1}</div>
          <div>${rec}</div>
        </div>
      `
        )
        .join("")}
    </div>
    
    ${
      feedback.additionalRequest
        ? `
    <!-- 회원님의 질문 -->
    <div class="section">
      <div class="section-title">💬 회원님의 질문</div>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${feedback.additionalRequest}
      </div>
    </div>
    `
        : ""
    }
    
    <!-- 푸터 -->
    <div class="footer">
      <p style="font-weight: 700; color: #8b5cf6; margin-bottom: 10px;">🎵 ConnecTone</p>
      <p>이 리포트는 ConnecTone의 인증 전문가가 작성했습니다</p>
      <p style="margin-top: 10px;">발급일: ${new Date(feedback.completedAt?.toDate?.() || new Date()).toLocaleDateString("ko-KR")}</p>
      <p style="margin-top: 5px;">문서 ID: ${feedbackId.substring(0, 8)}...</p>
    </div>
  </div>
  
  <script>
    // 자동으로 인쇄 다이얼로그 열기 (PDF로 저장 가능)
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>
  `;
}










