import { db } from "@/lib/api/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ProductDetail, SellerInfo } from "@/data/schemas/product";

export async function getProductDetail(productId: string): Promise<{
  success: boolean;
  product?: ProductDetail;
  error?: string;
}> {
  try {
    const productDoc = await getDoc(doc(db, "products", productId));

    if (!productDoc.exists()) {
      return {
        success: false,
        error: "상품을 찾을 수 없습니다.",
      };
    }

    const productData = productDoc.data();

    // tradeOptions가 없으면 shippingTypes를 변환
    let tradeOptions = productData.tradeOptions || [];
    if (tradeOptions.length === 0 && productData.shippingTypes) {
      tradeOptions = productData.shippingTypes.map((type: string) => {
        switch (type) {
          case "direct":
            return "직거래";
          case "pickup":
            return "직거래"; // 픽업도 직거래로 처리
          case "courier":
          case "parcel":
            return "택배";
          case "meetup":
            return "직거래";
          default:
            return type;
        }
      });
    }

    // tradeOptions가 여전히 비어있으면 기본값 설정
    if (tradeOptions.length === 0) {
      tradeOptions = ["직거래"]; // 기본값
    }

    const product: ProductDetail = {
      id: productDoc.id,
      title: productData.title || "",
      price: productData.price || 0,
      category: productData.category || "건반",
      region: productData.region || "",
      tradeOptions: tradeOptions,
      sellerId: productData.sellerId || "",
      description: productData.description || "",
      images: productData.images || [],
      createdAt: productData.createdAt,
      updatedAt: productData.updatedAt,
    };

    return {
      success: true,
      product,
    };
  } catch (error) {
    console.error("상품 정보 조회 실패:", error);
    return {
      success: false,
      error: "상품 정보를 불러오는데 실패했습니다.",
    };
  }
}

export async function getSellerInfo(sellerId: string): Promise<{
  success: boolean;
  seller?: SellerInfo;
  error?: string;
}> {
  try {
    const sellerDoc = await getDoc(doc(db, "users", sellerId));

    if (!sellerDoc.exists()) {
      return {
        success: false,
        error: "판매자 정보를 찾을 수 없습니다.",
      };
    }

    const sellerData = sellerDoc.data();
    const seller: SellerInfo = {
      id: sellerDoc.id,
      displayName: sellerData.displayName || "알 수 없음",
      grade: sellerData.grade || "E",
      phoneVerified: sellerData.phoneVerified || false,
      idVerified: sellerData.idVerified || false,
      bankVerified: sellerData.bankVerified || false,
    };

    return {
      success: true,
      seller,
    };
  } catch (error) {
    console.error("판매자 정보 조회 실패:", error);
    return {
      success: false,
      error: "판매자 정보를 불러오는데 실패했습니다.",
    };
  }
}
