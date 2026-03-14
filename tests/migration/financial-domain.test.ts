import { describe, expect, test } from "bun:test";
import {
  buildPaymentLedgerTransition,
  computePlatformFeeAmount,
  computeProviderFeeAmount,
  getMissingProvisioningFields,
  reconcilePaymentState,
} from "../../app/api/services/domain/financial/index";

describe("Financial domain", () => {
  test("detects missing provisioning fields for Asaas", () => {
    expect(
      getMissingProvisioningFields({
        name: "",
        email: null,
        document: null,
        phoneNumber: null,
        address: null,
        addressNumber: null,
        complement: null,
        province: null,
        postalCode: null,
        companyType: null,
        birthDate: null,
      })
    ).toEqual([
      "name",
      "email",
      "document",
      "phoneNumber",
      "address",
      "addressNumber",
      "province",
      "postalCode",
      "birthDate",
    ]);
  });

  test("calculates platform and provider fees", () => {
    expect(computePlatformFeeAmount(100, "percentage", 10)).toBe(10);
    expect(computePlatformFeeAmount(100, "fixed", 7.5)).toBe(7.5);
    expect(computeProviderFeeAmount(100, 92, null)).toBe(8);
  });

  test("builds payout scheduling ledger transition for posterior transfer", () => {
    const scheduledFor = new Date("2026-03-13T12:00:00.000Z");
    const transition = buildPaymentLedgerTransition({
      paymentId: "pay_123",
      paymentStatus: "paid",
      grossAmount: 100,
      netAmount: 86,
      providerFeeAmount: 4,
      platformFeeAmount: 10,
      occurredAt: new Date("2026-03-13T10:00:00.000Z"),
      settlementRuleId: "rule_123",
      settlementStrategy: "transferencia_posterior",
      platformFeeType: "percentage",
      platformFeeValue: 10,
      destinationWalletId: "wallet_dest",
      sourceWalletId: "wallet_source",
      scheduledFor,
    });

    expect(
      transition.ledgerEntries.some(
        (entry: { entryType: string }) => entry.entryType === "payout_scheduled"
      )
    ).toBe(true);
    expect(transition.payoutTransfer?.scheduledFor.toISOString()).toBe(scheduledFor.toISOString());
  });

  test("flags mismatched reconciliation states", () => {
    expect(
      reconcilePaymentState({
        internalStatus: "paid",
        providerStatus: "paid",
        internalGrossAmount: 100,
        providerGrossAmount: 100,
        internalNetAmount: 86,
        providerNetAmount: 84,
      })
    ).toEqual({
      status: "mismatched",
      reason: "payment_net_amount_mismatch",
    });
  });
});

