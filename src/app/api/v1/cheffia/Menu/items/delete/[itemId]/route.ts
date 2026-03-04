import { NextRequest, NextResponse } from "next/server";
import { fromThrowable } from "@/server/shared/output";
import { handleDeleteMenuItem } from "../shared";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params;
    return await handleDeleteMenuItem({
      request,
      itemId,
      endpoint: `/api/v1/cheffia/Menu/items/delete/${itemId}`,
    });
  } catch (error) {
    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
