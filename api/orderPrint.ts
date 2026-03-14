import { cheffiaApiConfig } from "@/api/config/cheffiaApiConfig";
import { orderHubPrintRoutes } from "@/api/routes/routesConfig";
import type {
  ClaimOrderPrintJobInput,
  ClaimOrderPrintJobOutput,
  CompleteOrderPrintJobInput,
  CompleteOrderPrintJobOutput,
  ReprintOrderPrintJobInput,
} from "@/lib/printing/jobContracts";

export interface OutputEnvelope<T> {
  isValid: boolean;
  successMessages: string[];
  errorMessages: string[];
  result: T | null;
}

const toOutputEnvelope = <T>(input: unknown): OutputEnvelope<T> =>
  input as OutputEnvelope<T>;

const parseAxiosErrorOutput = <T>(error: any): OutputEnvelope<T> | null => {
  if (error?.isAxiosError && error.response?.status === 400) {
    return toOutputEnvelope<T>(error.response.data);
  }
  return null;
};

export const claimOrderPrintJob = async (
  input: ClaimOrderPrintJobInput
): Promise<OutputEnvelope<ClaimOrderPrintJobOutput>> => {
  try {
    const response = await cheffiaApiConfig.post(orderHubPrintRoutes.claim, input);
    return toOutputEnvelope<ClaimOrderPrintJobOutput>(response.data);
  } catch (error: any) {
    const parsed = parseAxiosErrorOutput<ClaimOrderPrintJobOutput>(error);
    if (parsed) return parsed;
    throw error;
  }
};

export const completeOrderPrintJob = async (
  input: CompleteOrderPrintJobInput
): Promise<OutputEnvelope<CompleteOrderPrintJobOutput>> => {
  try {
    const response = await cheffiaApiConfig.post(orderHubPrintRoutes.complete, input);
    return toOutputEnvelope<CompleteOrderPrintJobOutput>(response.data);
  } catch (error: any) {
    const parsed = parseAxiosErrorOutput<CompleteOrderPrintJobOutput>(error);
    if (parsed) return parsed;
    throw error;
  }
};

export const reprintOrderPrintJob = async (
  input: ReprintOrderPrintJobInput
): Promise<OutputEnvelope<ClaimOrderPrintJobOutput>> => {
  try {
    const response = await cheffiaApiConfig.post(orderHubPrintRoutes.reprint, input);
    return toOutputEnvelope<ClaimOrderPrintJobOutput>(response.data);
  } catch (error: any) {
    const parsed = parseAxiosErrorOutput<ClaimOrderPrintJobOutput>(error);
    if (parsed) return parsed;
    throw error;
  }
};
