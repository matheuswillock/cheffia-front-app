import {
  FinancialReconciliationStatus,
  type Prisma,
} from "@prisma/client";
import { reconcilePaymentState } from "@/server/domain/financial";

export interface ReconcilePaymentSnapshotInput {
  tenantId: string;
  restaurantId: string;
  financialAccountId: string | null;
  customerOrderId: string | null;
  paymentDetailId: string;
  providerReference: string;
  internalSnapshot: {
    status: string | null;
    grossAmount: number | null;
    netAmount: number | null;
  };
  providerSnapshot: {
    status: string | null;
    grossAmount: number | null;
    netAmount: number | null;
    rawPayload: Prisma.InputJsonValue;
  };
}

const toPrismaStatus = (value: "matched" | "mismatched" | "pending" | "ignored" | "failed") => {
  switch (value) {
    case "matched":
      return FinancialReconciliationStatus.matched;
    case "mismatched":
      return FinancialReconciliationStatus.mismatched;
    case "ignored":
      return FinancialReconciliationStatus.ignored;
    case "failed":
      return FinancialReconciliationStatus.failed;
    default:
      return FinancialReconciliationStatus.pending;
  }
};

export class FinancialReconciliationService {
  public async reconcilePaymentSnapshot(
    tx: Prisma.TransactionClient,
    input: ReconcilePaymentSnapshotInput
  ): Promise<{ runId: string; status: FinancialReconciliationStatus; reason: string | null }> {
    const result = reconcilePaymentState({
      internalStatus: input.internalSnapshot.status,
      providerStatus: input.providerSnapshot.status,
      internalGrossAmount: input.internalSnapshot.grossAmount,
      providerGrossAmount: input.providerSnapshot.grossAmount,
      internalNetAmount: input.internalSnapshot.netAmount,
      providerNetAmount: input.providerSnapshot.netAmount,
    });
    const status = toPrismaStatus(result.status);
    const now = new Date();

    const run = await tx.financialReconciliationRun.create({
      data: {
        tenantId: input.tenantId,
        restaurantId: input.restaurantId,
        provider: "asaas",
        scope: "payment",
        status,
        startedAt: now,
        finishedAt: now,
        summary: {
          providerReference: input.providerReference,
          status: result.status,
          reason: result.reason,
        },
      },
      select: { id: true },
    });

    const existingItem = await tx.financialReconciliationItem.findFirst({
      where: {
        tenantId: input.tenantId,
        paymentDetailId: input.paymentDetailId,
        providerReference: input.providerReference,
      },
      orderBy: [{ updatedAt: "desc" }],
      select: { id: true },
    });

    const itemData = {
      restaurantId: input.restaurantId,
      reconciliationRunId: run.id,
      financialAccountId: input.financialAccountId,
      customerOrderId: input.customerOrderId,
      paymentDetailId: input.paymentDetailId,
      providerReference: input.providerReference,
      status,
      reason: result.reason,
      internalSnapshot: input.internalSnapshot as Prisma.InputJsonValue,
      providerSnapshot: {
        status: input.providerSnapshot.status,
        grossAmount: input.providerSnapshot.grossAmount,
        netAmount: input.providerSnapshot.netAmount,
        rawPayload: input.providerSnapshot.rawPayload,
      } as Prisma.InputJsonValue,
      resolvedAt: status === FinancialReconciliationStatus.matched ? now : null,
    };

    if (existingItem) {
      await tx.financialReconciliationItem.update({
        where: { id: existingItem.id },
        data: itemData,
      });
    } else {
      await tx.financialReconciliationItem.create({
        data: {
          tenantId: input.tenantId,
          ...itemData,
        },
      });
    }

    return {
      runId: run.id,
      status,
      reason: result.reason,
    };
  }
}
