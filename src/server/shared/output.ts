export interface Output<T> {
  isValid: boolean;
  successMessages: string[];
  errorMessages: string[];
  result: T | null;
}

export const okOutput = <T>(
  result: T,
  successMessages: string[] = []
): Output<T> => ({
  isValid: true,
  successMessages,
  errorMessages: [],
  result,
});

export const failOutput = <T = null>(
  errorMessages: string[] | string,
  result: T | null = null
): Output<T> => ({
  isValid: false,
  successMessages: [],
  errorMessages: Array.isArray(errorMessages) ? errorMessages : [errorMessages],
  result,
});

export const fromThrowable = (
  error: unknown,
  context: { requestId?: string; tenantId?: string } = {}
): Output<null> => {
  const message = error instanceof Error ? error.message : "Unexpected error";

  console.error("server.error", {
    requestId: context.requestId ?? null,
    tenantId: context.tenantId ?? null,
    message,
  });

  return failOutput<null>(message);
};
