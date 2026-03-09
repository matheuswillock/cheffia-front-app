import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "@/server/infra/supabase/adminClient";
import type {
  FinancialDocumentStorage,
  FinancialDocumentStorageUploadInput,
  PrivateStorageUploadResult,
} from "./types";

const DEFAULT_BUCKET = "cheffia-financial-documents";

const getBucketName = (): string =>
  (process.env.SUPABASE_STORAGE_FINANCIAL_DOCUMENTS_BUCKET ?? DEFAULT_BUCKET).trim() ||
  DEFAULT_BUCKET;

const sanitizeFilename = (fileName: string): string => {
  const normalized = fileName.normalize("NFKD").replace(/[^\w.-]+/g, "-").toLowerCase();
  return normalized.replace(/-+/g, "-").replace(/^-|-$/g, "") || "file";
};

export class SupabaseFinancialDocumentStorage implements FinancialDocumentStorage {
  public async uploadOnboardingDocument(
    input: FinancialDocumentStorageUploadInput
  ): Promise<PrivateStorageUploadResult> {
    const supabase = getSupabaseAdminClient();
    const bucket = getBucketName();
    const safeName = sanitizeFilename(input.fileName);
    const path = [
      "tenant",
      input.tenantId,
      "restaurants",
      input.restaurantId,
      "financial-accounts",
      input.financialAccountId,
      "documents",
      input.onboardingDocumentId,
      `${randomUUID()}-${safeName}`,
    ].join("/");

    const { error } = await supabase.storage.from(bucket).upload(path, input.data, {
      upsert: false,
      contentType: input.contentType,
      cacheControl: "3600",
    });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    return {
      bucket,
      path,
    };
  }
}
