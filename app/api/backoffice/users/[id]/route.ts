import { NextRequest, NextResponse } from "next/server";
import {
  InternalUsersService,
  requireBackofficeUser,
  type UpdateBackofficeUserInput,
} from "@/app/api/useCases/backoffice";
import { backofficeErrorResponse } from "../../_utils";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireBackofficeUser({ minimumRole: "admin" });
    const { id } = await params;
    const body = (await request.json()) as UpdateBackofficeUserInput;
    const service = new InternalUsersService();
    const output = await service.update(id, body);
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    return backofficeErrorResponse(error);
  }
}
