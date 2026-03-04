import { NextRequest, NextResponse } from "next/server";
import { fromThrowable } from "@/server/shared/output";
import { handleDeleteMenuItem } from "./shared";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
  try {
    const itemId = request.nextUrl.searchParams.get("itemId")?.trim() ?? "";
    return await handleDeleteMenuItem({
      request,
      itemId,
      endpoint: "/api/v1/cheffia/Menu/items/delete",
    });
  } catch (error) {
    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
