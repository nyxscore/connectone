import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json();

    // Gmail SMTP 설정
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.GMAIL_USER,
      to: to,
      subject: subject,
      html: html,
      text: text,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ 이메일 발송 성공:", { to, subject });

    return NextResponse.json({
      success: true,
      message: "이메일이 성공적으로 발송되었습니다.",
    });
  } catch (error) {
    console.error("❌ 이메일 발송 실패:", error);

    return NextResponse.json(
      {
        success: false,
        error: "이메일 발송에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
