import {
  AccountApprovalStatus,
  AsaasAccountType,
  FinancialOnboardingStatus,
  FinancialWebhookStatus,
  type PrismaClient,
} from "@prisma/client";
import { AsaasClient, type AsaasSubaccountPayload, type AsaasWebhookConfigPayload } from "@/app/api/infra/external/asaas";
import { prisma as defaultPrisma, withPrismaRetry } from "@/app/api/infra/prisma";
import { encryptSecret } from "@/lib/server/secrets";
import { failOutput, okOutput, type Output } from "@/lib/server/output";
import { getMissingProvisioningFields, normalizeDigits } from "@/app/api/services/domain/financial";
import { scheduleInitialRestaurantFinancialSync } from "./initialDocumentSyncScheduler";
import type { RestaurantFinancialAccountOutput } from "./types";

type RestaurantProvisioningRecord = {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  document: string | null;
  phoneNumber: string | null;
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  province: string | null;
  postalCode: string | null;
  companyType: string | null;
  birthDate: Date | null;
};

type FinancialAccountRecord = {
  id: string;
  tenantId: string;
  restaurantId: string;
  provider: string;
  accountType: AsaasAccountType;
  onboardingStatus: FinancialOnboardingStatus;
  generalStatus: AccountApprovalStatus;
  commercialInfoStatus: AccountApprovalStatus;
  bankAccountStatus: AccountApprovalStatus;
  documentationStatus: AccountApprovalStatus;
  webhookStatus: FinancialWebhookStatus;
  commercialInfoExpirationScheduledAt: Date | null;
  commercialInfoIsExpired: boolean;
  lastStatusSyncAt: Date | null;
  asaasAccountId: string | null;
  asaasWalletId: string | null;
  asaasApiKeyEncrypted: string | null;
  lastError: string | null;
};

type InitialSyncEligibleAccount = Pick<
  FinancialAccountRecord,
  "asaasAccountId" | "asaasApiKeyEncrypted"
>;

const toIsoDate = (value: Date): string => {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getConfiguredAccountType = (): AsaasAccountType => {
  const raw = (process.env.ASAAS_SUBACCOUNT_TYPE ?? "").trim().toLowerCase();
  return raw === "standard" ? AsaasAccountType.standard : AsaasAccountType.white_label;
};

const assertEncryptionConfigured = (): void => {
  const secret = process.env.ASAAS_SUBACCOUNT_API_KEY_ENCRYPTION_SECRET?.trim() ?? "";
  if (!secret) {
    throw new Error("Missing ASAAS_SUBACCOUNT_API_KEY_ENCRYPTION_SECRET environment variable.");
  }
};

const buildWebhookConfigs = (): AsaasWebhookConfigPayload[] => {
  const url =
    process.env.ASAAS_SUBACCOUNT_WEBHOOK_URL?.trim() ??
    process.env.ASAAS_WEBHOOK_URL?.trim() ??
    "";

  if (!url) return [];

  const configuredEvents = (process.env.ASAAS_SUBACCOUNT_WEBHOOK_EVENTS ?? "")
    .split(",")
    .map((event) => event.trim())
    .filter(Boolean);

  const events =
    configuredEvents.length > 0
      ? configuredEvents
      : ["PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];

  return [
    {
      name: "Cheffia financeiro restaurante",
      url,
      sendType: "SEQUENTIALLY",
      interrupted: false,
      enabled: true,
      apiVersion: 3,
      authToken: process.env.ASAAS_WEBHOOK_TOKEN?.trim() || undefined,
      events,
    },
  ];
};

const mapOutput = (
  account: FinancialAccountRecord,
  overrides: { missingFields?: string[] } = {}
): RestaurantFinancialAccountOutput => ({
  financialAccountId: account.id,
  restaurantId: account.restaurantId,
  provider: account.provider,
  accountType: account.accountType,
  onboardingStatus: account.onboardingStatus,
  generalStatus: account.generalStatus,
  commercialInfoStatus: account.commercialInfoStatus,
  bankAccountStatus: account.bankAccountStatus,
  documentationStatus: account.documentationStatus,
  webhookStatus: account.webhookStatus,
  commercialInfoExpirationScheduledAt: account.commercialInfoExpirationScheduledAt?.toISOString() ?? null,
  commercialInfoIsExpired: account.commercialInfoIsExpired,
  lastStatusSyncAt: account.lastStatusSyncAt?.toISOString() ?? null,
  asaasAccountId: account.asaasAccountId,
  asaasWalletId: account.asaasWalletId,
  hasEncryptedApiKey: Boolean(account.asaasApiKeyEncrypted),
  missingFields: overrides.missingFields ?? [],
  lastError: account.lastError,
});

export class RestaurantFinancialAccountService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly asaas: AsaasClient | null = null
  ) {}

  private getAsaasClient(): AsaasClient {
    return this.asaas ?? new AsaasClient();
  }

  private async getRestaurantForProvisioning(
    tenantId: string,
    restaurantId: string
  ): Promise<RestaurantProvisioningRecord | null> {
    return withPrismaRetry(
      () =>
        this.prisma.restaurant.findFirst({
          where: { tenantId, id: restaurantId },
          select: {
            id: true,
            tenantId: true,
            name: true,
            email: true,
            document: true,
            phoneNumber: true,
            address: true,
            addressNumber: true,
            complement: true,
            province: true,
            postalCode: true,
            companyType: true,
            birthDate: true,
          },
        }),
      { label: "financialAccounts.getRestaurantForProvisioning" }
    );
  }

  private async findExistingAccount(
    tenantId: string,
    restaurantId: string
  ): Promise<FinancialAccountRecord | null> {
    return withPrismaRetry(
      () =>
        this.prisma.restaurantFinancialAccount.findFirst({
          where: {
            tenantId,
            restaurantId,
            provider: "asaas",
          },
        }),
      { label: "financialAccounts.findExistingAccount" }
    );
  }

  public async getTenantByAsaasAccountId(asaasAccountId: string): Promise<string | null> {
    const sanitized = asaasAccountId.trim();
    if (!sanitized) return null;

    const row = await withPrismaRetry(
      () =>
        this.prisma.restaurantFinancialAccount.findFirst({
          where: {
            provider: "asaas",
            asaasAccountId: sanitized,
          },
          select: {
            tenantId: true,
          },
        }),
      { label: "financialAccounts.getTenantByAsaasAccountId" }
    );

    return row?.tenantId ?? null;
  }

  private getInitialSyncMessage(
    account: InitialSyncEligibleAccount,
    tenantId: string,
    restaurantId: string,
    requestId?: string
  ): string | null {
    if (!account.asaasAccountId || !account.asaasApiKeyEncrypted) {
      return null;
    }

    const scheduled = scheduleInitialRestaurantFinancialSync({
      tenantId,
      restaurantId,
      requestId,
    });

    switch (scheduled.reason) {
      case "scheduled":
        return `Initial Asaas onboarding sync scheduled in ${scheduled.delayMs}ms`;
      case "already_scheduled":
        return "Initial Asaas onboarding sync was already scheduled";
      case "disabled":
        return null;
      default:
        return null;
    }
  }

  public async ensureDraftAccount(
    tenantId: string,
    restaurantId: string
  ): Promise<Output<RestaurantFinancialAccountOutput>> {
    try {
      const restaurant = await this.getRestaurantForProvisioning(tenantId, restaurantId);
      if (!restaurant) {
        return failOutput("Restaurant not found");
      }

      const existing = await this.findExistingAccount(tenantId, restaurantId);
      if (existing) {
        return okOutput(mapOutput(existing), ["Financial account already initialized"]);
      }

      const created = await withPrismaRetry(
        () =>
          this.prisma.restaurantFinancialAccount.create({
            data: {
              tenantId,
              restaurantId,
              provider: "asaas",
              accountType: getConfiguredAccountType(),
              onboardingStatus: FinancialOnboardingStatus.draft,
              generalStatus: AccountApprovalStatus.pending,
              commercialInfoStatus: AccountApprovalStatus.pending,
              bankAccountStatus: AccountApprovalStatus.pending,
              documentationStatus: AccountApprovalStatus.pending,
              webhookStatus: FinancialWebhookStatus.pending,
            },
          }),
        { label: "financialAccounts.ensureDraftAccount.create" }
      );

      return okOutput(mapOutput(created), ["Financial account draft initialized"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Failed to initialize financial account draft: ${message}`);
    }
  }

  public async getAccountStatus(
    tenantId: string,
    restaurantId: string
  ): Promise<Output<RestaurantFinancialAccountOutput>> {
    try {
      const restaurant = await this.getRestaurantForProvisioning(tenantId, restaurantId);
      if (!restaurant) {
        return failOutput("Restaurant not found");
      }

      const account = await this.findExistingAccount(tenantId, restaurantId);
      if (!account) {
        return failOutput("Financial account not initialized");
      }

      return okOutput(mapOutput(account, {
        missingFields: getMissingProvisioningFields(restaurant),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Failed to load financial account status: ${message}`);
    }
  }

  public async provisionSubaccount(
    tenantId: string,
    restaurantId: string,
    context: { requestId?: string } = {}
  ): Promise<Output<RestaurantFinancialAccountOutput>> {
    const draft = await this.ensureDraftAccount(tenantId, restaurantId);
    if (!draft.result) {
      return failOutput(draft.errorMessages);
    }

    try {
      const restaurant = await this.getRestaurantForProvisioning(tenantId, restaurantId);
      if (!restaurant) {
        return failOutput("Restaurant not found");
      }

      const existing = await this.findExistingAccount(tenantId, restaurantId);
      if (!existing) {
        return failOutput("Financial account draft not found");
      }

      if (existing.asaasAccountId) {
        const messages = ["Asaas subaccount already provisioned"];
        const syncMessage = this.getInitialSyncMessage(
          existing,
          tenantId,
          restaurantId,
          context.requestId
        );
        if (syncMessage) {
          messages.push(syncMessage);
        }

        return okOutput(mapOutput(existing), messages);
      }

      const missingFields = getMissingProvisioningFields(restaurant);
      if (missingFields.length > 0) {
        const message = `Missing required restaurant fields for Asaas provisioning: ${missingFields.join(", ")}`;
        const updated = await withPrismaRetry(
          () =>
            this.prisma.restaurantFinancialAccount.update({
              where: { id: existing.id },
              data: {
                onboardingStatus: FinancialOnboardingStatus.draft,
                lastError: message,
              },
            }),
          { label: "financialAccounts.provisionSubaccount.missingFields" }
        );

        return failOutput(message, mapOutput(updated, { missingFields }));
      }

      const webhookConfigs = buildWebhookConfigs();
      const payload: AsaasSubaccountPayload = {
        name: restaurant.name.trim(),
        email: restaurant.email!.trim(),
        cpfCnpj: normalizeDigits(restaurant.document),
        birthDate: restaurant.birthDate ? toIsoDate(restaurant.birthDate) : undefined,
        companyType: restaurant.companyType?.trim() || undefined,
        phone: restaurant.phoneNumber?.trim() || undefined,
        mobilePhone: restaurant.phoneNumber?.trim() || undefined,
        address: restaurant.address!.trim(),
        addressNumber: restaurant.addressNumber!.trim(),
        complement: restaurant.complement?.trim() || undefined,
        province: restaurant.province!.trim(),
        postalCode: normalizeDigits(restaurant.postalCode),
        webhooks: webhookConfigs.length > 0 ? webhookConfigs : undefined,
      };

      await withPrismaRetry(
        () =>
          this.prisma.restaurantFinancialAccount.update({
            where: { id: existing.id },
            data: {
              accountType: getConfiguredAccountType(),
              onboardingStatus: FinancialOnboardingStatus.provisioning,
              lastError: null,
            },
        }),
        { label: "financialAccounts.provisionSubaccount.markProvisioning" }
      );

      assertEncryptionConfigured();
      const subaccount = await this.getAsaasClient().createSubaccount(payload, {
        tenantId,
        requestId: context.requestId,
      });
      const encryptedApiKey = subaccount.apiKey ? encryptSecret(subaccount.apiKey) : null;
      const lastError = encryptedApiKey
        ? null
        : "Asaas subaccount created, but apiKey was not returned in the response.";

      const updated = await withPrismaRetry(
        () =>
          this.prisma.$transaction(async (tx) => {
            const account = await tx.restaurantFinancialAccount.update({
              where: { id: existing.id },
              data: {
                asaasAccountId: subaccount.id,
                asaasWalletId: subaccount.walletId ?? null,
                asaasApiKeyEncrypted: encryptedApiKey,
                asaasApiKeyLast4: subaccount.apiKey ? subaccount.apiKey.slice(-4) : null,
                onboardingStatus: FinancialOnboardingStatus.account_created,
                generalStatus: AccountApprovalStatus.pending,
                commercialInfoStatus: AccountApprovalStatus.pending,
                bankAccountStatus: AccountApprovalStatus.pending,
                documentationStatus: AccountApprovalStatus.pending,
                webhookStatus:
                  webhookConfigs.length > 0
                    ? FinancialWebhookStatus.configured
                    : FinancialWebhookStatus.pending,
                lastStatusSyncAt: null,
                lastError,
              },
            });

            await tx.restaurant.update({
              where: { id: restaurant.id },
              data: {
                financialOnboardingStartedAt: new Date(),
              },
            });

            return account;
          }),
        { label: "financialAccounts.provisionSubaccount.persist" }
      );

      if (lastError) {
        return failOutput(lastError, mapOutput(updated));
      }

      const messages = ["Asaas subaccount provisioned successfully"];
      const syncMessage = this.getInitialSyncMessage(
        updated,
        tenantId,
        restaurantId,
        context.requestId
      );
      if (syncMessage) {
        messages.push(syncMessage);
      }

      return okOutput(mapOutput(updated), messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";

      const existing = await this.findExistingAccount(tenantId, restaurantId);
      if (existing) {
        await withPrismaRetry(
          () =>
            this.prisma.restaurantFinancialAccount.update({
              where: { id: existing.id },
              data: {
                onboardingStatus: FinancialOnboardingStatus.failed,
                lastError: message,
              },
            }),
          { label: "financialAccounts.provisionSubaccount.fail" }
        ).catch(() => undefined);
      }

      return failOutput(`Failed to provision Asaas subaccount: ${message}`);
    }
  }
}



