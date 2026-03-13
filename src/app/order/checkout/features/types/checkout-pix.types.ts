import type { OutputCreateIntent } from "@/models/dtos/output/OutputCreateIntent";

export interface CheckoutPixFormValue {
  name: string;
  phoneNumber: string;
  email: string;
  document: string;
  payTip: boolean;
}

export interface CheckoutPixState {
  customerOrderId: string | null;
  form: CheckoutPixFormValue;
  charge: OutputCreateIntent | null;
  isSubmitting: boolean;
  isPolling: boolean;
  errorMessage: string | null;
  infoMessage: string | null;
  confirmationStatus: string | null;
  copyFeedback: string | null;
}
