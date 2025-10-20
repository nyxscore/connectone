const admin = require("firebase-admin");

// 환경변수에서 Firebase 설정 가져오기
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "connectone-8b414", // Firebase 프로젝트 ID 직접 지정
});

const db = admin.firestore();

// 상태별 라벨 매핑
const statusLabels = {
  active: "판매중",
  reserved: "거래중",
  escrow_completed: "결제완료",
  shipping: "배송중",
  sold: "거래완료",
  cancelled: "거래취소",
};

// 상태별 색상 매핑
const statusColors = {
  active: "bg-green-100 text-green-800",
  reserved: "bg-orange-100 text-orange-800",
  escrow_completed: "bg-orange-100 text-orange-800",
  shipping: "bg-blue-100 text-blue-800",
  sold: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

async function fixNotificationStatus() {
  try {
    console.log("🔍 잘못된 상태의 알림들을 찾는 중...");

    // 모든 거래 업데이트 알림 조회
    const notificationsSnapshot = await db
      .collection("notifications")
      .where("type", "==", "transaction_update")
      .get();

    console.log(
      `📦 발견된 거래 업데이트 알림: ${notificationsSnapshot.size}개`
    );

    if (notificationsSnapshot.size === 0) {
      console.log("✅ 수정할 알림이 없습니다!");
      return;
    }

    const batch = db.batch();
    let count = 0;

    for (const doc of notificationsSnapshot.docs) {
      const notification = doc.data();
      const notificationId = doc.id;

      // 알림 데이터에서 itemId 추출 시도
      let itemId = null;

      // 여러 방법으로 itemId 찾기
      if (notification.data?.itemId) {
        itemId = notification.data.itemId;
      } else if (notification.data?.productId) {
        itemId = notification.data.productId;
      } else if (notification.data?.transactionId) {
        // transactionId에서 추출 시도
        itemId = notification.data.transactionId;
      }

      if (!itemId) {
        console.log(`⚠️ ${notificationId}: itemId를 찾을 수 없음 - 건너뜀`);
        continue;
      }

      try {
        // 해당 상품의 실제 상태 확인
        const itemRef = db.collection("items").doc(itemId);
        const itemDoc = await itemRef.get();

        if (!itemDoc.exists) {
          console.log(
            `⚠️ ${notificationId}: 상품 ${itemId}을 찾을 수 없음 - 건너뜀`
          );
          continue;
        }

        const itemData = itemDoc.data();
        const actualStatus = itemData.status || "active";

        // 현재 알림의 상태와 실제 상품 상태 비교
        const currentStatus = notification.data?.status;

        if (currentStatus === actualStatus) {
          console.log(
            `✓ ${notificationId}: 상태 일치 (${actualStatus}) - 수정 불필요`
          );
          continue;
        }

        console.log(
          `🔧 ${notificationId}: ${currentStatus} → ${actualStatus} 수정`
        );

        // 알림 데이터 업데이트
        const notificationRef = db
          .collection("notifications")
          .doc(notificationId);
        batch.update(notificationRef, {
          "data.status": actualStatus,
          "data.statusLabel": statusLabels[actualStatus] || actualStatus,
          "data.statusColor":
            statusColors[actualStatus] || "bg-gray-100 text-gray-800",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        count++;

        // 메시지도 실제 상태에 맞게 업데이트
        const statusMessages = {
          active: "상품이 다시 판매중으로 변경되었습니다",
          reserved: "거래가 시작되었습니다",
          escrow_completed: "안전결제가 완료되었습니다",
          shipping: "상품이 발송되었습니다",
          sold: "거래가 완료되었습니다",
          cancelled: "거래가 취소되었습니다",
        };

        const newMessage = `"${notification.data?.productTitle || "상품"}" 거래가 ${statusMessages[actualStatus] || "상태가 변경되었습니다"}`;

        batch.update(notificationRef, {
          message: newMessage,
        });
      } catch (error) {
        console.error(`❌ ${notificationId} 처리 중 오류:`, error);
        continue;
      }
    }

    if (count > 0) {
      await batch.commit();
      console.log(`✅ ${count}개 알림 상태 수정 완료!`);
    } else {
      console.log("✅ 수정할 알림이 없습니다!");
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  } finally {
    process.exit(0);
  }
}

fixNotificationStatus();
