import { NextRequest, NextResponse } from "next/server";
import {
  InternalUsersService,
  requireBackofficeUser,
  type CreateBackofficeUserInput,
} from "@/server/application/backoffice";
import { backofficeErrorResponse } from "../_utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireBackofficeUser({ minimumRole: "operator" });
    const service = new InternalUsersService();
    const output = await service.list();
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    return backofficeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireBackofficeUser({ minimumRole: "admin" });
    const body = (await request.json()) as CreateBackofficeUserInput;
    const service = new InternalUsersService();
    const output = await service.create(body);
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    return backofficeErrorResponse(error);
  }
}
