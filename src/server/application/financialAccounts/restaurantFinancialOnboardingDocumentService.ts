import { createHash } from "crypto";
import {
  AccountApprovalStatus,
  FinancialDocumentUploadStatus,
  FinancialOnboardingStatus,
  Prisma,
  type PrismaClient,
} from "@prisma/client";
import { AsaasClient } from "@/server/infra/external/asaas";
import { prisma as defaultPrisma, withPrismaRetry } from "@/server/infra/prisma";
import {
  SupabaseFinancialDocumentStorage,
  type FinancialDocumentStorage,
} from "@/server/infra/storage";
import { failOutput, okOutput, type Output } from "@/server/shared/output";
import { decryptSecret } from "@/server/shared/secrets";
import { mapApprovalStatus, mapOnboardingStatus, parseAsaasDateTime } from "./statusMapping";
import type {
  RestaurantFinancialOnboardingDocumentOutput,
  RestaurantFinancialOnboardingDocumentUploadOutput,
} from "./types";

type FinancialAccountCredentialsRecord = {
  id: string;
  tenantId: string;
  restaurantId: string;
  asaasAccountId: string | null;
  asaasApiKeyEncrypted: string | null;
  onboardingStatus: FinancialOnboardingStatus;
  commercialInfoIsExpired: boolean;
  commercialInfoExpirationScheduledAt: Date | null;
};

type OnboardingDocumentWithUploadsRecord = {
  id: string;
  financialAccountId: string;
  providerDocumentGroupId: string;
  type: string;
  title: string;
  description: string | null;
  responsibleName: string | null;
  responsibleType: string | null;
  status: AccountApprovalStatus;
  onboardingUrl: string | null;
  rejectReasons: Prisma.JsonValue | null;
  lastSyncedAt: Date | null;
  uploads: Array<{
    id: string;
    providerDocumentGroupId: string;
    providerDocumentFileId: string | null;
    uploadType: string;
    fileName: string;
    storageBucket: string;
    storagePath: string;
    contentType: string;
    fileSizeBytes: number;
    sha256: string | null;
    status: FinancialDocumentUploadStatus;
    errorMessage: string | null;
    uploadedAt: Date | null;
    createdAt: Date;
  }>;
};

export interface UploadFinancialOnboardingDocumentInput {
  fileName: string;
  contentType: string;
  data: Uint8Array;
}

const toIsoString = (value: Date | null): string | null => value?.toISOString() ?? null;

const mapUploadOutput = (
  record: OnboardingDocumentWithUploadsRecord["uploads"][number]
): RestaurantFinancialOnboardingDocumentUploadOutput => ({
  uploadId: record.id,
  providerDocumentGroupId: record.providerDocumentGroupId,
  providerDocumentFileId: record.providerDocumentFileId,
  uploadType: record.uploadType,
  fileName: record.fileName,
  storageBucket: record.storageBucket,
  storagePath: record.storagePath,
  contentType: record.contentType,
  fileSizeBytes: record.fileSizeBytes,
  sha256: record.sha256,
  status: record.status,
  errorMessage: record.errorMessage,
  uploadedAt: toIsoString(record.uploadedAt),
  createdAt: record.createdAt.toISOString(),
});

const mapDocumentOutput = (
  record: OnboardingDocumentWithUploadsRecord
): RestaurantFinancialOnboardingDocumentOutput => ({
  onboardingDocumentId: record.id,
  financialAccountId: record.financialAccountId,
  providerDocumentGroupId: record.providerDocumentGroupId,
  type: record.type,
  title: record.title,
  description: record.description,
  responsibleName: record.responsibleName,
  responsibleType: record.responsibleType,
  status: record.status,
  onboardingUrl: record.onboardingUrl,
  canUploadDirectly: !record.onboardingUrl,
  rejectReasons: record.rejectReasons,
  lastSyncedAt: toIsoString(record.lastSyncedAt),
  uploads: record.uploads.map(mapUploadOutput),
});

export class RestaurantFinancialOnboardingDocumentService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly storage: FinancialDocumentStorage = new SupabaseFinancialDocumentStorage()
  ) {}

  private async getFinancialAccountCredentials(
    tenantId: string,
    restaurantId: string
  ): Promise<FinancialAccountCredentialsRecord | null> {
    return withPrismaRetry(
      () =>
        this.prisma.restaurantFinancialAccount.findFirst({
          where: {
            tenantId,
            restaurantId,
            provider: "asaas",
          },
          select: {
            id: true,
            tenantId: true,
            restaurantId: true,
            asaasAccountId: true,
            asaasApiKeyEncrypted: true,
            onboardingStatus: true,
            commercialInfoIsExpired: true,
            commercialInfoExpirationScheduledAt: true,
          },
        }),
      { label: "financialDocuments.getFinancialAccountCredentials" }
    );
  }

  private getSubaccountClient(account: FinancialAccountCredentialsRecord): AsaasClient {
    if (!account.asaasAccountId) {
      throw new Error("Asaas subaccount was not provisioned yet.");
    }

    if (!account.asaasApiKeyEncrypted) {
      throw new Error("Encrypted Asaas API key is missing for the restaurant subaccount.");
    }

    return new AsaasClient({
      apiKey: decryptSecret(account.asaasApiKeyEncrypted),
    });
  }

  private async getStoredDocuments(
    tenantId: string,
    restaurantId: string
  ): Promise<OnboardingDocumentWithUploadsRecord[]> {
    return withPrismaRetry(
      () =>
        this.prisma.restaurantFinancialOnboardingDocument.findMany({
          where: { tenantId, restaurantId },
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            financialAccountId: true,
            providerDocumentGroupId: true,
            type: true,
            title: true,
            description: true,
            responsibleName: true,
            responsibleType: true,
            status: true,
            onboardingUrl: true,
            rejectReasons: true,
            lastSyncedAt: true,
            uploads: {
              orderBy: [{ createdAt: "desc" }],
              select: {
                id: true,
                providerDocumentGroupId: true,
                providerDocumentFileId: true,
                uploadType: true,
                fileName: true,
                storageBucket: true,
                storagePath: true,
                contentType: true,
                fileSizeBytes: true,
                sha256: true,
                status: true,
                errorMessage: true,
                uploadedAt: true,
                createdAt: true,
              },
            },
          },
        }),
      { label: "financialDocuments.getStoredDocuments" }
    );
  }

  public async listDocuments(
    tenantId: string,
    restaurantId: string
  ): Promise<Output<RestaurantFinancialOnboardingDocumentOutput[]>> {
    try {
      const account = await this.getFinancialAccountCredentials(tenantId, restaurantId);
      if (!account) {
        return failOutput("Financial account not initialized");
      }

      const records = await this.getStoredDocuments(tenantId, restaurantId);
      return okOutput(records.map(mapDocumentOutput));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Failed to list onboarding documents: ${message}`);
    }
  }

  public async syncDocuments(
    tenantId: string,
    restaurantId: string
  ): Promise<Output<RestaurantFinancialOnboardingDocumentOutput[]>> {
    try {
      const account = await this.getFinancialAccountCredentials(tenantId, restaurantId);
      if (!account) {
        return failOutput("Financial account not initialized");
      }

      const asaas = this.getSubaccountClient(account);
      const [documentsResponse, statusResponse] = await Promise.all([
        asaas.getMyAccountDocuments({ tenantId }),
        asaas.getMyAccountStatus({ tenantId }),
      ]);

      const documentationStatus = mapApprovalStatus(statusResponse.documentation);
      const generalStatus = mapApprovalStatus(statusResponse.general);
      const commercialInfoStatus = mapApprovalStatus(statusResponse.commercialInfo);
      const bankAccountStatus = mapApprovalStatus(statusResponse.bankAccountInfo);
      const commercialInfoIsExpired =
        statusResponse.commercialInfoExpiration?.isExpired ?? account.commercialInfoIsExpired;
      const commercialInfoExpirationScheduledAt =
        parseAsaasDateTime(statusResponse.commercialInfoExpiration?.scheduledDate) ??
        account.commercialInfoExpirationScheduledAt;
      const onboardingStatus = mapOnboardingStatus({
        general: generalStatus,
        documentation: documentationStatus,
        commercialInfoExpired: commercialInfoIsExpired,
      });
      const now = new Date();
      const rejectReasons =
        documentsResponse.rejectReasons === null
          ? Prisma.JsonNull
          : (documentsResponse.rejectReasons as Prisma.InputJsonValue | undefined);

      await withPrismaRetry(
        () =>
          this.prisma.$transaction(async (tx) => {
            for (const documentGroup of documentsResponse.data) {
              await tx.restaurantFinancialOnboardingDocument.upsert({
                where: {
                  tenantId_financialAccountId_providerDocumentGroupId: {
                    tenantId,
                    financialAccountId: account.id,
                    providerDocumentGroupId: documentGroup.id,
                  },
                },
                create: {
                  tenantId,
                  restaurantId,
                  financialAccountId: account.id,
                  providerDocumentGroupId: documentGroup.id,
                  type: documentGroup.type,
                  title: documentGroup.title,
                  description: documentGroup.description ?? null,
                  responsibleName: documentGroup.responsible?.name ?? null,
                  responsibleType: documentGroup.responsible?.type ?? null,
                  status: mapApprovalStatus(documentGroup.status),
                  onboardingUrl: documentGroup.onboardingUrl ?? null,
                  rejectReasons,
                  lastSyncedAt: now,
                },
                update: {
                  type: documentGroup.type,
                  title: documentGroup.title,
                  description: documentGroup.description ?? null,
                  responsibleName: documentGroup.responsible?.name ?? null,
                  responsibleType: documentGroup.responsible?.type ?? null,
                  status: mapApprovalStatus(documentGroup.status),
                  onboardingUrl: documentGroup.onboardingUrl ?? null,
                  rejectReasons,
                  lastSyncedAt: now,
                },
              });
            }

            await tx.restaurantFinancialAccount.update({
              where: { id: account.id },
              data: {
                onboardingStatus,
                commercialInfoStatus,
                bankAccountStatus,
                documentationStatus,
                generalStatus,
                commercialInfoIsExpired,
                commercialInfoExpirationScheduledAt,
                lastStatusSyncAt: now,
                lastError: null,
              },
            });

            if (onboardingStatus === FinancialOnboardingStatus.approved) {
              await tx.restaurant.update({
                where: { id: restaurantId },
                data: {
                  financialOnboardingCompletedAt: now,
                },
              });
            }
          }),
        { label: "financialDocuments.syncDocuments" }
      );

      const listed = await this.listDocuments(tenantId, restaurantId);
      if (!listed.result) {
        return failOutput(listed.errorMessages);
      }

      return okOutput(listed.result, ["Financial onboarding documents synchronized"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";

      await withPrismaRetry(
        () =>
          this.prisma.restaurantFinancialAccount.updateMany({
            where: {
              tenantId,
              restaurantId,
              provider: "asaas",
            },
            data: {
              lastError: `Document sync failed: ${message}`,
            },
          }),
        { label: "financialDocuments.syncDocuments.fail" }
      ).catch(() => undefined);

      return failOutput(`Failed to synchronize onboarding documents: ${message}`);
    }
  }

  public async uploadDocument(
    tenantId: string,
    restaurantId: string,
    onboardingDocumentId: string,
    input: UploadFinancialOnboardingDocumentInput
  ): Promise<Output<RestaurantFinancialOnboardingDocumentUploadOutput>> {
    if (!input.fileName.trim()) {
      return failOutput("File name is required");
    }

    if (input.data.byteLength <= 0) {
      return failOutput("Document file cannot be empty");
    }

    try {
      const record = await withPrismaRetry(
        () =>
          this.prisma.restaurantFinancialOnboardingDocument.findFirst({
            where: {
              tenantId,
              restaurantId,
              id: onboardingDocumentId,
            },
            select: {
              id: true,
              tenantId: true,
              restaurantId: true,
              financialAccountId: true,
              providerDocumentGroupId: true,
              type: true,
              onboardingUrl: true,
              financialAccount: {
                select: {
                  id: true,
                  tenantId: true,
                  restaurantId: true,
                  asaasAccountId: true,
                  asaasApiKeyEncrypted: true,
                  onboardingStatus: true,
                  commercialInfoIsExpired: true,
                  commercialInfoExpirationScheduledAt: true,
                },
              },
            },
          }),
        { label: "financialDocuments.uploadDocument.find" }
      );

      if (!record?.financialAccount) {
        return failOutput("Onboarding document not found");
      }

      if (record.onboardingUrl) {
        return failOutput(
          "This document must be submitted through onboardingUrl. Asaas does not accept direct API upload for this document group."
        );
      }

      const storageResult = await this.storage.uploadOnboardingDocument({
        tenantId,
        restaurantId,
        financialAccountId: record.financialAccountId,
        onboardingDocumentId,
        fileName: input.fileName,
        contentType: input.contentType,
        data: input.data,
      });

      const sha256 = createHash("sha256").update(input.data).digest("hex");
      const createdUpload = await withPrismaRetry(
        () =>
          this.prisma.restaurantFinancialOnboardingDocumentUpload.create({
            data: {
              tenantId,
              restaurantId,
              financialAccountId: record.financialAccountId,
              onboardingDocumentId,
              providerDocumentGroupId: record.providerDocumentGroupId,
              uploadType: record.type,
              fileName: input.fileName,
              storageBucket: storageResult.bucket,
              storagePath: storageResult.path,
              contentType: input.contentType,
              fileSizeBytes: input.data.byteLength,
              sha256,
              status: FinancialDocumentUploadStatus.stored,
            },
            select: {
              id: true,
              providerDocumentGroupId: true,
              providerDocumentFileId: true,
              uploadType: true,
              fileName: true,
              storageBucket: true,
              storagePath: true,
              contentType: true,
              fileSizeBytes: true,
              sha256: true,
              status: true,
              errorMessage: true,
              uploadedAt: true,
              createdAt: true,
            },
          }),
        { label: "financialDocuments.uploadDocument.createAudit" }
      );

      try {
        const asaas = this.getSubaccountClient(record.financialAccount);
        const providerResponse = await asaas.uploadMyAccountDocument(
          record.providerDocumentGroupId,
          {
            type: record.type,
            fileName: input.fileName,
            contentType: input.contentType,
            data: input.data,
          },
          { tenantId }
        );

        const updated = await withPrismaRetry(
          () =>
            this.prisma.restaurantFinancialOnboardingDocumentUpload.update({
              where: { id: createdUpload.id },
              data: {
                providerDocumentFileId:
                  typeof providerResponse.id === "string" ? providerResponse.id : null,
                status: FinancialDocumentUploadStatus.uploaded,
                providerRawResponse: providerResponse as Prisma.InputJsonValue,
                errorMessage: null,
                uploadedAt: new Date(),
              },
              select: {
                id: true,
                providerDocumentGroupId: true,
                providerDocumentFileId: true,
                uploadType: true,
                fileName: true,
                storageBucket: true,
                storagePath: true,
                contentType: true,
                fileSizeBytes: true,
                sha256: true,
                status: true,
                errorMessage: true,
                uploadedAt: true,
                createdAt: true,
              },
            }),
          { label: "financialDocuments.uploadDocument.markUploaded" }
        );

        await this.syncDocuments(tenantId, restaurantId);

        return okOutput(mapUploadOutput(updated), [
          "Financial onboarding document uploaded to Asaas",
        ]);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected upload error";

        const failed = await withPrismaRetry(
          () =>
            this.prisma.restaurantFinancialOnboardingDocumentUpload.update({
              where: { id: createdUpload.id },
              data: {
                status: FinancialDocumentUploadStatus.failed,
                errorMessage: message,
              },
              select: {
                id: true,
                providerDocumentGroupId: true,
                providerDocumentFileId: true,
                uploadType: true,
                fileName: true,
                storageBucket: true,
                storagePath: true,
                contentType: true,
                fileSizeBytes: true,
                sha256: true,
                status: true,
                errorMessage: true,
                uploadedAt: true,
                createdAt: true,
              },
            }),
          { label: "financialDocuments.uploadDocument.markFailed" }
        );

        return failOutput(`Failed to upload document to Asaas: ${message}`, mapUploadOutput(failed));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Failed to store/upload onboarding document: ${message}`);
    }
  }
}
