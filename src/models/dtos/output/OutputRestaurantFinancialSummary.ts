import { Output } from "@/models/Output";

export class OutputRestaurantFinancialSummary {
  restaurantId: string;
  financialAccountId: string | null;
  onboardingStatus: string;
  currency: string;
  pendingPixAmount: number;
  receivedAmount: number;
  availableAmount: number;
  scheduledPayoutAmount: number;
  pendingDocumentsCount: number;
  rejectedDocumentsCount: number;
  reconciliationMismatchCount: number;
  lastStatusSyncAt: string | null;
  lastPaymentAt: string | null;
  lastReconciliationAt: string | null;
  nextPayoutAt: string | null;

  constructor(data: OutputRestaurantFinancialSummary) {
    this.restaurantId = data.restaurantId;
    this.financialAccountId = data.financialAccountId;
    this.onboardingStatus = data.onboardingStatus;
    this.currency = data.currency;
    this.pendingPixAmount = data.pendingPixAmount;
    this.receivedAmount = data.receivedAmount;
    this.availableAmount = data.availableAmount;
    this.scheduledPayoutAmount = data.scheduledPayoutAmount;
    this.pendingDocumentsCount = data.pendingDocumentsCount;
    this.rejectedDocumentsCount = data.rejectedDocumentsCount;
    this.reconciliationMismatchCount = data.reconciliationMismatchCount;
    this.lastStatusSyncAt = data.lastStatusSyncAt;
    this.lastPaymentAt = data.lastPaymentAt;
    this.lastReconciliationAt = data.lastReconciliationAt;
    this.nextPayoutAt = data.nextPayoutAt;
  }

  static fromOutputResult(output: Output): OutputRestaurantFinancialSummary {
    return new OutputRestaurantFinancialSummary(output.result);
  }
}
