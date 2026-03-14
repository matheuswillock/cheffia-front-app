import {
  claimOrderPrintJob,
  completeOrderPrintJob,
  reprintOrderPrintJob,
  type OutputEnvelope,
} from "@/api/orderPrint";
import type { OrderPrintTicketPayload } from "@/lib/printing/contracts";
import type {
  ClaimOrderPrintJobInput,
  ClaimOrderPrintJobOutput,
  CompleteOrderPrintJobInput,
  CompleteOrderPrintJobOutput,
  ReprintOrderPrintJobInput,
} from "@/lib/printing/jobContracts";

const LOCAL_PRINT_AGENT_URL =
  process.env.NEXT_PUBLIC_LOCAL_PRINT_AGENT_URL?.trim() || "http://127.0.0.1:7777";

export const claimOrderPrintJobRequest = async (
  input: ClaimOrderPrintJobInput
): Promise<OutputEnvelope<ClaimOrderPrintJobOutput>> => claimOrderPrintJob(input);

export const completeOrderPrintJobRequest = async (
  input: CompleteOrderPrintJobInput
): Promise<OutputEnvelope<CompleteOrderPrintJobOutput>> => completeOrderPrintJob(input);

export const reprintOrderPrintJobRequest = async (
  input: ReprintOrderPrintJobInput
): Promise<OutputEnvelope<ClaimOrderPrintJobOutput>> => reprintOrderPrintJob(input);

export const sendTicketToLocalPrintAgent = async (
  payload: OrderPrintTicketPayload
): Promise<void> => {
  const response = await fetch(`${LOCAL_PRINT_AGENT_URL}/print`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Local print agent error (${response.status}): ${body || "unable to print ticket"}`
    );
  }
};

export const checkLocalPrintAgentHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${LOCAL_PRINT_AGENT_URL}/health`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) return false;
    const body = (await response.json()) as { ok?: boolean };
    return body.ok === true;
  } catch {
    return false;
  }
};
