import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createTransaction,
  updateTransactionStatus,
  getUserTransactions,
} from "@/lib/api/payment";

// Mock fetch
global.fetch = vi.fn();

describe("Payment API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTransaction", () => {
    it("creates a transaction successfully", async () => {
      const mockTransaction = {
        id: "tx123",
        productId: "prod123",
        buyerId: "user123",
        sellerId: "seller123",
        amount: 1500000,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTransaction),
      } as Response);

      const result = await createTransaction({
        productId: "prod123",
        amount: 1500000,
      });

      expect(fetch).toHaveBeenCalledWith("/api/transactions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: "prod123",
          amount: 1500000,
        }),
      });

      expect(result).toEqual(mockTransaction);
    });

    it("handles creation error", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Invalid product" }),
      } as Response);

      await expect(
        createTransaction({
          productId: "invalid",
          amount: 1500000,
        })
      ).rejects.toThrow("Invalid product");
    });
  });

  describe("updateTransactionStatus", () => {
    it("updates transaction status successfully", async () => {
      const mockTransaction = {
        id: "tx123",
        status: "paid_hold",
        updatedAt: new Date(),
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTransaction),
      } as Response);

      const result = await updateTransactionStatus("tx123", "paid_hold");

      expect(fetch).toHaveBeenCalledWith("/api/transactions/tx123/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "paid_hold",
        }),
      });

      expect(result).toEqual(mockTransaction);
    });

    it("handles update error", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Transaction not found" }),
      } as Response);

      await expect(
        updateTransactionStatus("invalid", "paid_hold")
      ).rejects.toThrow("Transaction not found");
    });
  });

  describe("getUserTransactions", () => {
    it("fetches user transactions successfully", async () => {
      const mockTransactions = [
        {
          id: "tx123",
          productId: "prod123",
          buyerId: "user123",
          sellerId: "seller123",
          amount: 1500000,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTransactions),
      } as Response);

      const result = await getUserTransactions("user123");

      expect(fetch).toHaveBeenCalledWith("/api/transactions/user/user123");

      expect(result).toEqual(mockTransactions);
    });

    it("handles fetch error", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      } as Response);

      await expect(getUserTransactions("user123")).rejects.toThrow(
        "Internal server error"
      );
    });
  });
});
















