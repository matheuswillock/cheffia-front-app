import { Output } from "@/models/Output";

export class OutputCreateIntent {
  id: string;
  amount: number;
  status: string;
  method: string;
  qrCode: string | null;
  copyPasteCode: string | null;
  platformFee: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;

  constructor(
    id: string,
    amount: number,
    status: string,
    method: string,
    qrCode: string | null,
    copyPasteCode: string | null,
    platformFee: number,
    description: string,
    createdAt: string,
    updatedAt: string,
    expiresAt: string | null
  ) {
    this.id = id;
    this.amount = amount;
    this.status = status;
    this.method = method;
    this.qrCode = qrCode;
    this.copyPasteCode = copyPasteCode;
    this.platformFee = platformFee;
    this.description = description;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.expiresAt = expiresAt;
  }

  static fromOutputResult(output: Output): OutputCreateIntent {
    return new OutputCreateIntent(
      output.result.data.id,
      output.result.data.amount,
      output.result.data.status,
      output.result.data.method,
      output.result.data.brCode,
      output.result.data.brCodeBase64,
      output.result.data.platformFee,
      output.result.data.description,
      output.result.data.createdAt,
      output.result.data.updatedAt,
      output.result.data.expiresAt
    );
  }
}
