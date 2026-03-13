import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/server/application/payments";
import { failOutput, fromThrowable } from "@/server/shared/output";

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  const service = new PaymentService();

  try {
    const output = await service.createProduct({
      productName: "deprecated",
      productDescription: "deprecated",
      price: 0,
      currency: "brl",
    });

    return NextResponse.json(output, { status: 410 });
  } catch (error) {
    return NextResponse.json(
      failOutput(fromThrowable(error).errorMessages[0] ?? "Unexpected error"),
      { status: 500 }
    );
  }
}
