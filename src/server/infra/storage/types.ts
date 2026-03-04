export interface StorageUploadInput {
  tenantId: string;
  menuId: string;
  fileName: string;
  contentType: string;
  data: Uint8Array;
}

export interface StorageUploadResult {
  path: string;
  publicUrl: string;
}

export interface MenuMediaStorage {
  uploadMenuItemMedia(input: StorageUploadInput): Promise<StorageUploadResult>;
  removeMenuItemMedia(path: string): Promise<void>;
}
