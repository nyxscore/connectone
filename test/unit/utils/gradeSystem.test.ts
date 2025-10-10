import { describe, it, expect } from "vitest";
import {
  calculateUserGrade,
  calculateUserProgress,
  getGradeInfo,
  getGradeColor,
  GRADE_INFO,
} from "@/lib/utils/gradeSystem";

describe("Grade System Utils", () => {
  describe("calculateUserGrade", () => {
    it("returns C grade for new user", () => {
      const user = {
        safeTransactionCount: 0,
        averageRating: 0,
        disputeCount: 0,
      };

      expect(calculateUserGrade(user)).toBe("C");
    });

    it("returns D grade for user with 1 safe transaction", () => {
      const user = {
        safeTransactionCount: 1,
        averageRating: 4.0,
        disputeCount: 0,
      };

      expect(calculateUserGrade(user)).toBe("D");
    });

    it("returns E grade for user with 3 safe transactions", () => {
      const user = {
        safeTransactionCount: 3,
        averageRating: 4.2,
        disputeCount: 0,
      };

      expect(calculateUserGrade(user)).toBe("E");
    });

    it("returns F grade for user with 5 safe transactions", () => {
      const user = {
        safeTransactionCount: 5,
        averageRating: 4.5,
        disputeCount: 0,
      };

      expect(calculateUserGrade(user)).toBe("F");
    });

    it("returns G grade for user with 10 safe transactions", () => {
      const user = {
        safeTransactionCount: 10,
        averageRating: 4.7,
        disputeCount: 0,
      };

      expect(calculateUserGrade(user)).toBe("G");
    });

    it("returns A grade for user with 20 safe transactions", () => {
      const user = {
        safeTransactionCount: 20,
        averageRating: 4.8,
        disputeCount: 0,
      };

      expect(calculateUserGrade(user)).toBe("A");
    });

    it("returns B grade for user with 50 safe transactions", () => {
      const user = {
        safeTransactionCount: 50,
        averageRating: 4.9,
        disputeCount: 0,
      };

      expect(calculateUserGrade(user)).toBe("B");
    });

    it("downgrades user with disputes", () => {
      const user = {
        safeTransactionCount: 20,
        averageRating: 4.8,
        disputeCount: 1,
      };

      expect(calculateUserGrade(user)).toBe("G");
    });

    it("downgrades user with low rating", () => {
      const user = {
        safeTransactionCount: 20,
        averageRating: 3.5,
        disputeCount: 0,
      };

      expect(calculateUserGrade(user)).toBe("G");
    });
  });

  describe("calculateUserProgress", () => {
    it("calculates progress for C grade user", () => {
      const user = {
        safeTransactionCount: 0,
        averageRating: 0,
        disputeCount: 0,
      };

      const progress = calculateUserProgress(user);

      expect(progress.currentGrade).toBe("C");
      expect(progress.nextGrade).toBe("D");
      expect(progress.percentage).toBe(0);
      expect(progress.requirements).toContain("안전거래 1회");
    });

    it("calculates progress for D grade user", () => {
      const user = {
        safeTransactionCount: 1,
        averageRating: 4.0,
        disputeCount: 0,
      };

      const progress = calculateUserProgress(user);

      expect(progress.currentGrade).toBe("D");
      expect(progress.nextGrade).toBe("E");
      expect(progress.percentage).toBe(50);
      expect(progress.requirements).toContain("안전거래 3회");
    });

    it("calculates progress for B grade user (highest)", () => {
      const user = {
        safeTransactionCount: 50,
        averageRating: 4.9,
        disputeCount: 0,
      };

      const progress = calculateUserProgress(user);

      expect(progress.currentGrade).toBe("B");
      expect(progress.nextGrade).toBe("B");
      expect(progress.percentage).toBe(100);
    });
  });

  describe("getGradeInfo", () => {
    it("returns correct info for each grade", () => {
      expect(getGradeInfo("C")).toEqual(GRADE_INFO.C);
      expect(getGradeInfo("D")).toEqual(GRADE_INFO.D);
      expect(getGradeInfo("E")).toEqual(GRADE_INFO.E);
      expect(getGradeInfo("F")).toEqual(GRADE_INFO.F);
      expect(getGradeInfo("G")).toEqual(GRADE_INFO.G);
      expect(getGradeInfo("A")).toEqual(GRADE_INFO.A);
      expect(getGradeInfo("B")).toEqual(GRADE_INFO.B);
    });
  });

  describe("getGradeColor", () => {
    it("returns correct colors for each grade", () => {
      expect(getGradeColor("C")).toBe("text-gray-600");
      expect(getGradeColor("D")).toBe("text-blue-600");
      expect(getGradeColor("E")).toBe("text-green-600");
      expect(getGradeColor("F")).toBe("text-yellow-600");
      expect(getGradeColor("G")).toBe("text-orange-600");
      expect(getGradeColor("A")).toBe("text-purple-600");
      expect(getGradeColor("B")).toBe("text-red-600");
    });
  });

  describe("GRADE_INFO", () => {
    it("has correct structure for all grades", () => {
      Object.values(GRADE_INFO).forEach(grade => {
        expect(grade).toHaveProperty("name");
        expect(grade).toHaveProperty("description");
        expect(grade).toHaveProperty("color");
        expect(grade).toHaveProperty("requirements");
        expect(typeof grade.name).toBe("string");
        expect(typeof grade.description).toBe("string");
        expect(typeof grade.color).toBe("string");
        expect(Array.isArray(grade.requirements)).toBe(true);
      });
    });

    it("has unique names for all grades", () => {
      const names = Object.values(GRADE_INFO).map(grade => grade.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("has unique colors for all grades", () => {
      const colors = Object.values(GRADE_INFO).map(grade => grade.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });
  });
});
























