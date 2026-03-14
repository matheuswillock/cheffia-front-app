import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "@/app/api/infra/supabase/adminClient";
import type { MenuMediaStorage, StorageUploadInput, StorageUploadResult } from "./types";

const DEFAULT_BUCKET = "cheffia-menu-media";

const getBucketName = (): string =>
  (process.env.SUPABASE_STORAGE_MENU_BUCKET ?? DEFAULT_BUCKET).trim() || DEFAULT_BUCKET;

const sanitizeFilename = (fileName: string): string => {
  const normalized = fileName.normalize("NFKD").replace(/[^\w.-]+/g, "-").toLowerCase();
  return normalized.replace(/-+/g, "-").replace(/^-|-$/g, "") || "file";
};

export class SupabaseMenuMediaStorage implements MenuMediaStorage {
  public async uploadMenuItemMedia(input: StorageUploadInput): Promise<StorageUploadResult> {
    const supabase = getSupabaseAdminClient();
    const bucket = getBucketName();

    const safeName = sanitizeFilename(input.fileName);
    const path = [
      "tenant",
      input.tenantId,
      "menus",
      input.menuId,
      "items",
      `${randomUUID()}-${safeName}`,
    ].join("/");

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, input.data, {
      upsert: false,
      contentType: input.contentType,
      cacheControl: "3600",
    });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return {
      path,
      publicUrl: data.publicUrl,
    };
  }

  public async removeMenuItemMedia(path: string): Promise<void> {
    const trimmedPath = path.trim();
    if (!trimmedPath.length) return;

    const bucket = getBucketName();
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase.storage.from(bucket).remove([trimmedPath]);
    if (!error) return;

    // Keep delete idempotent if file is already gone.
    if (error.message.toLowerCase().includes("not found")) return;

    throw new Error(`Storage remove failed: ${error.message}`);
  }
}
