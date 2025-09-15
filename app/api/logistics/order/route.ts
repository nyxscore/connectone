import { NextRequest, NextResponse } from "next/server";

// Static export configuration
export const dynamic = "force-static";
import { collection, addDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../../lib/api/firebase";
import {
  CreateLogisticsOrderInput,
  LogisticsOrder,
  LogisticsQuote,
  Product,
} from "../../../../data/types";

export async function POST(request: NextRequest) {
  try {
    const input: CreateLogisticsOrderInput = await request.json();

    if (
      !input.quoteId ||
      !input.productId ||
      !input.buyerId ||
      !input.sellerId
    ) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 견적 정보 조회 (실제로는 견적 DB에서 조회)
    // 현재는 Mock 데이터로 대체
    const mockQuote: LogisticsQuote = {
      id: input.quoteId,
      productId: input.productId,
      fromAddress: {
        address: "서울시 강남구 테헤란로 123",
        floor: 3,
        hasElevator: true,
      },
      toAddress: {
        address: "부산시 해운대구 센텀중앙로 456",
        floor: 5,
        hasElevator: false,
      },
      insurance: true,
      estimatedPrice: 15000,
      estimatedDays: 2,
      carrier: "CJ대한통운",
      serviceType: "일반택배",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    // 상품 정보 조회
    const productRef = doc(db, "products", input.productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const product = { id: productSnap.id, ...productSnap.data() } as Product;

    // 운송 주문 생성
    const logisticsOrder: Omit<LogisticsOrder, "id"> = {
      productId: input.productId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      quoteId: input.quoteId,
      fromAddress: mockQuote.fromAddress,
      toAddress: mockQuote.toAddress,
      insurance: mockQuote.insurance,
      price: mockQuote.estimatedPrice,
      carrier: mockQuote.carrier,
      serviceType: mockQuote.serviceType,
      status: "pending",
      estimatedDelivery: new Date(
        Date.now() + mockQuote.estimatedDays * 24 * 60 * 60 * 1000
      ),
      createdAt: Timestamp.now().toDate(),
      updatedAt: Timestamp.now().toDate(),
    };

    const docRef = await addDoc(
      collection(db, "logisticsOrders"),
      logisticsOrder
    );

    console.log(`📦 운송 주문 생성: ${docRef.id}`);
    console.log(`🚚 운송업체: ${logisticsOrder.carrier}`);
    console.log(`💰 운송비: ${logisticsOrder.price.toLocaleString()}원`);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...logisticsOrder },
    });
  } catch (error) {
    console.error("운송 주문 생성 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "운송 주문 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
