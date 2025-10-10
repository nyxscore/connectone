"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
// Firebase Admin 초기화
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
// Firestore 인스턴스
exports.db = (0, firestore_1.getFirestore)();
//# sourceMappingURL=firebase.js.map