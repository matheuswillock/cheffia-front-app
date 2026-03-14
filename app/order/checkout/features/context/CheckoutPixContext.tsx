"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  confirmCheckoutPixCharge,
  createCheckoutPixCharge,
} from "@/app/order/checkout/features/services/CheckoutPixService";
import type {
  CheckoutPixFormValue,
  CheckoutPixState,
} from "@/app/order/checkout/features/types/checkout-pix.types";

interface CheckoutPixContextValue extends CheckoutPixState {
  setField: <K extends keyof CheckoutPixFormValue>(field: K, value: CheckoutPixFormValue[K]) => void;
  submitCharge: () => Promise<void>;
  confirmNow: () => Promise<void>;
  copyPixCode: () => Promise<void>;
}

const CheckoutPixContext = createContext<CheckoutPixContextValue | undefined>(undefined);

interface CheckoutPixFeatureProviderProps {
  children: React.ReactNode;
  customerOrderId: string | null;
}

const initialForm: CheckoutPixFormValue = {
  name: "",
  phoneNumber: "",
  email: "",
  document: "",
  payTip: false,
};

export function CheckoutPixFeatureProvider({
  children,
  customerOrderId,
}: CheckoutPixFeatureProviderProps) {
  const router = useRouter();
  const [state, setState] = useState<CheckoutPixState>({
    customerOrderId,
    form: initialForm,
    charge: null,
    isSubmitting: false,
    isPolling: false,
    errorMessage: customerOrderId ? null : "Informe o parâmetro customerOrderId para gerar o PIX.",
    infoMessage: customerOrderId
      ? "Preencha os dados do pagador para gerar a cobrança PIX."
      : null,
    confirmationStatus: null,
    copyFeedback: null,
  });
  const pollAttemptsRef = useRef(0);

  useEffect(() => {
    setState((current) => ({
      ...current,
      customerOrderId,
      errorMessage: customerOrderId
        ? current.errorMessage === "Informe o parâmetro customerOrderId para gerar o PIX."
          ? null
          : current.errorMessage
        : "Informe o parâmetro customerOrderId para gerar o PIX.",
      infoMessage: customerOrderId ? current.infoMessage : null,
    }));
  }, [customerOrderId]);

  const setField = useCallback(
    <K extends keyof CheckoutPixFormValue>(field: K, value: CheckoutPixFormValue[K]) => {
      setState((current) => ({
        ...current,
        form: {
          ...current.form,
          [field]: value,
        },
        copyFeedback: field === "payTip" ? current.copyFeedback : null,
      }));
    },
    []
  );

  const chargeId = state.charge?.id ?? null;
  const checkoutCustomerOrderId = state.customerOrderId ?? "";

  const runConfirmation = useCallback(async () => {
    if (!chargeId) return;

    const confirmation = await confirmCheckoutPixCharge(chargeId);
    const normalizedStatus = confirmation.status.trim().toLowerCase();

    setState((current) => ({
      ...current,
      confirmationStatus: confirmation.status,
      infoMessage:
        normalizedStatus === "paid"
          ? "Pagamento confirmado. Redirecionando para o comprovante."
          : `Status atual do PIX: ${confirmation.status}.`,
      errorMessage: null,
    }));

    if (normalizedStatus === "paid") {
      router.push(
        `/order/checkout/success?customerOrderId=${checkoutCustomerOrderId}&paymentPixId=${chargeId}&status=${encodeURIComponent(
          confirmation.status
        )}`
      );
    }
  }, [chargeId, checkoutCustomerOrderId, router]);

  const submitCharge = useCallback(async () => {
    if (!state.customerOrderId || state.isSubmitting) return;

    try {
      setState((current) => ({
        ...current,
        isSubmitting: true,
        errorMessage: null,
        infoMessage: "Gerando cobrança PIX no Asaas...",
        copyFeedback: null,
      }));

      const charge = await createCheckoutPixCharge({
        customerOrderId: state.customerOrderId,
        payTip: state.form.payTip,
        payer: {
          name: state.form.name,
          phoneNumber: state.form.phoneNumber,
          email: state.form.email || null,
          document: state.form.document || null,
        },
      });

      pollAttemptsRef.current = 0;
      setState((current) => ({
        ...current,
        charge,
        isSubmitting: false,
        isPolling: true,
        confirmationStatus: charge.status,
        errorMessage: null,
        infoMessage: "PIX gerado. Estamos confirmando o pagamento automaticamente.",
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível gerar a cobrança PIX.";
      setState((current) => ({
        ...current,
        isSubmitting: false,
        isPolling: false,
        errorMessage: message,
      }));
    }
  }, [state.customerOrderId, state.form, state.isSubmitting]);

  const confirmNow = useCallback(async () => {
    if (!state.charge?.id) return;

    try {
      setState((current) => ({
        ...current,
        isPolling: true,
        errorMessage: null,
      }));
      await runConfirmation();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível consultar o status do PIX.";
      setState((current) => ({
        ...current,
        isPolling: false,
        errorMessage: message,
      }));
    }
  }, [runConfirmation, state.charge?.id]);

  useEffect(() => {
    if (!state.charge?.id || !state.isPolling) return;

    const interval = window.setInterval(() => {
      pollAttemptsRef.current += 1;
      void runConfirmation().catch((error) => {
        const message = error instanceof Error ? error.message : "Falha ao confirmar o PIX.";
        setState((current) => ({
          ...current,
          isPolling: false,
          errorMessage: message,
        }));
      });

      if (pollAttemptsRef.current >= 12) {
        window.clearInterval(interval);
        setState((current) => ({
          ...current,
          isPolling: false,
          infoMessage: "Seguimos aguardando a confirmação do PIX. Você pode consultar manualmente.",
        }));
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [runConfirmation, state.charge?.id, state.isPolling]);

  const copyPixCode = useCallback(async () => {
    const pixCode = state.charge?.copyPasteCode ?? state.charge?.qrCode ?? null;
    if (!pixCode) return;

    await navigator.clipboard.writeText(pixCode);
    setState((current) => ({
      ...current,
      copyFeedback: "Código PIX copiado.",
    }));
  }, [state.charge?.copyPasteCode, state.charge?.qrCode]);

  const value = useMemo<CheckoutPixContextValue>(
    () => ({
      ...state,
      setField,
      submitCharge,
      confirmNow,
      copyPixCode,
    }),
    [confirmNow, copyPixCode, setField, state, submitCharge]
  );

  return <CheckoutPixContext.Provider value={value}>{children}</CheckoutPixContext.Provider>;
}

export const useCheckoutPix = (): CheckoutPixContextValue => {
  const context = useContext(CheckoutPixContext);
  if (!context) {
    throw new Error("useCheckoutPix must be used within CheckoutPixFeatureProvider");
  }
  return context;
};


