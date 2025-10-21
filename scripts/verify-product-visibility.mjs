#!/usr/bin/env node
/**
 * 상품 목록 가시성 자동 검증 스크립트
 * 
 * 이 스크립트는:
 * 1. Firestore에 있는 모든 상품을 조회
 * 2. 각 상태별로 올바르게 필터링되는지 확인
 * 3. 누락된 상품이 있으면 경고
 * 
 * 사용법: node scripts/verify-product-visibility.mjs
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDy-EXIHVfzBhKcsNq93BfmQ2SQCWRszOs",
  authDomain: "connectone-8b414.firebaseapp.com",
  projectId: "connectone-8b414",
  storageBucket: "connectone-8b414.firebasestorage.app",
  messagingSenderId: "567550026947",
  appId: "1:567550026947:web:92120b0c926db2ece06e76",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 상태 그룹 정의 (product-status.ts와 동기화)
const STATUS_GROUPS = {
  ALL_ACTIVE: ["active", "reserved", "escrow_completed", "shipping", "shipped", "sold"],
  AVAILABLE: ["active"],
  TRADING: ["reserved", "escrow_completed", "shipping", "shipped"],
  SHIPPING_RELATED: ["shipping", "shipped"],
  COMPLETED: ["sold"],
  CANCELLED: ["cancelled"],
};

async function verifyProductVisibility() {
  console.log("\n" + "=".repeat(80));
  console.log("🔍 ConnecTone 상품 가시성 자동 검증");
  console.log("=".repeat(80) + "\n");

  try {
    // 모든 상품 조회
    const itemsSnapshot = await getDocs(collection(db, "items"));
    const allItems = [];
    
    itemsSnapshot.forEach(doc => {
      allItems.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`📦 총 ${allItems.length}개의 상품 발견\n`);

    // 상태별 통계
    const statusStats = {};
    allItems.forEach(item => {
      statusStats[item.status] = (statusStats[item.status] || 0) + 1;
    });

    console.log("📊 상태별 통계:");
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}개`);
    });
    console.log("");

    // 각 필터별 검증
    const filters = [
      { name: "전체 (기본)", statuses: STATUS_GROUPS.ALL_ACTIVE },
      { name: "거래가능", statuses: STATUS_GROUPS.AVAILABLE },
      { name: "거래중", statuses: STATUS_GROUPS.TRADING },
      { name: "배송중", statuses: STATUS_GROUPS.SHIPPING_RELATED },
      { name: "거래완료", statuses: STATUS_GROUPS.COMPLETED },
    ];

    let hasIssues = false;

    console.log("=".repeat(80));
    console.log("✅ 필터별 가시성 검증\n");

    for (const filter of filters) {
      const visibleItems = allItems.filter(item => 
        filter.statuses.includes(item.status)
      );
      
      const invisibleItems = allItems.filter(item => 
        !filter.statuses.includes(item.status) && 
        item.status !== "cancelled" && 
        item.status !== "deleted"
      );

      console.log(`📋 "${filter.name}" 필터:`);
      console.log(`   ✅ 표시됨: ${visibleItems.length}개`);
      
      if (invisibleItems.length > 0 && filter.name === "전체 (기본)") {
        console.log(`   ⚠️  숨겨짐: ${invisibleItems.length}개`);
        console.log(`   ❌ 문제: 전체 목록에서 활성 상품이 숨겨져 있습니다!`);
        hasIssues = true;
        
        // 숨겨진 상품 상세 정보
        console.log(`\n   숨겨진 상품 목록:`);
        invisibleItems.forEach((item, index) => {
          console.log(`   ${index + 1}. [${item.status}] ${item.title}`);
        });
        console.log("");
      }
      
      // 샘플 표시
      if (visibleItems.length > 0) {
        const sample = visibleItems.slice(0, 3);
        console.log(`   샘플:`);
        sample.forEach(item => {
          console.log(`      - [${item.status}] ${item.title?.substring(0, 40)}...`);
        });
      }
      console.log("");
    }

    // 알 수 없는 상태 감지
    const knownStatuses = [
      "active", "reserved", "escrow_completed", 
      "shipping", "shipped", "sold", "cancelled", "deleted"
    ];
    const unknownStatuses = Object.keys(statusStats).filter(
      status => !knownStatuses.includes(status)
    );

    if (unknownStatuses.length > 0) {
      console.log("⚠️  알 수 없는 상태 발견:");
      unknownStatuses.forEach(status => {
        console.log(`   - "${status}": ${statusStats[status]}개`);
      });
      console.log("   → product-status.ts에 추가 필요!\n");
      hasIssues = true;
    }

    // 최종 결과
    console.log("=".repeat(80));
    if (hasIssues) {
      console.log("❌ 검증 실패: 상품 가시성에 문제가 있습니다!");
      console.log("   → lib/api/products.ts의 필터링 로직을 확인하세요.");
      process.exit(1);
    } else {
      console.log("✅ 검증 성공: 모든 상품이 올바르게 표시됩니다!");
      console.log(`   - 총 ${allItems.length}개 상품 확인 완료`);
      console.log(`   - ${Object.keys(statusStats).length}개 상태 확인 완료`);
    }
    console.log("=".repeat(80) + "\n");

    process.exit(0);

  } catch (error) {
    console.error("\n❌ 검증 중 오류 발생:", error);
    process.exit(1);
  }
}

verifyProductVisibility();

