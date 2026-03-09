import { NextResponse } from "next/server";
import { failOutput, fromThrowable } from "@/server/shared/output";
import { BackofficeAccessError } from "@/server/application/backoffice";

export const backofficeErrorResponse = (error: unknown): NextResponse => {
  if (error instanceof BackofficeAccessError) {
    return NextResponse.json(failOutput(error.message), {
      status: error.statusCode,
    });
  }

  return NextResponse.json(fromThrowable(error), { status: 500 });
};
