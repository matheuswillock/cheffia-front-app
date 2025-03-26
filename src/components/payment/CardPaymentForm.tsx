'use client';

import { useEffect, useState } from 'react';
import { loadMercadoPago } from '@mercadopago/sdk-js';

interface CardPaymentFormProps {
  amount: number;
  onPaymentSuccess?: (response: any) => void;
  onPaymentError?: (error: any) => void;
}

export function CardPaymentForm({ amount, onPaymentSuccess, onPaymentError }: CardPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeMercadoPago = async () => {
      try {
        await loadMercadoPago();
        const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!);

        const cardForm = mp.cardForm({
          amount: amount.toString(),
          iframe: true,
          form: {
            id: "form-checkout",
            cardNumber: {
              id: "form-checkout__cardNumber",
              placeholder: "Número do cartão",
            },
            expirationDate: {
              id: "form-checkout__expirationDate",
              placeholder: "MM/YY",
            },
            securityCode: {
              id: "form-checkout__securityCode",
              placeholder: "Código de segurança",
            },
            cardholderName: {
              id: "form-checkout__cardholderName",
              placeholder: "Titular do cartão",
            },
            issuer: {
              id: "form-checkout__issuer",
              placeholder: "Banco emissor",
            },
            installments: {
              id: "form-checkout__installments",
              placeholder: "Parcelas",
            },
            identificationType: {
              id: "form-checkout__identificationType",
              placeholder: "Tipo de documento",
            },
            identificationNumber: {
              id: "form-checkout__identificationNumber",
              placeholder: "Número do documento",
            },
            cardholderEmail: {
              id: "form-checkout__cardholderEmail",
              placeholder: "E-mail",
            },
          },
          callbacks: {
            onFormMounted: (error) => {
              if (error) {
                console.warn("Form Mounted handling error: ", error);
                onPaymentError?.(error);
              }
            },
            onSubmit: async (event) => {
              event.preventDefault();
              setIsLoading(true);

              try {
                const {
                  paymentMethodId,
                  issuerId,
                  cardholderEmail,
                  amount,
                  token,
                  installments,
                  identificationNumber,
                  identificationType,
                } = cardForm.getCardFormData();

                const response = await fetch("/api/payments/process", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    token,
                    issuer_id: issuerId,
                    payment_method_id: paymentMethodId,
                    transaction_amount: Number(amount),
                    installments: Number(installments),
                    description: "Pagamento via Checkout Transparente",
                    payer: {
                      email: cardholderEmail,
                      identification: {
                        type: identificationType,
                        number: identificationNumber,
                      },
                    },
                  }),
                });

                const data = await response.json();
                
                if (response.ok) {
                  onPaymentSuccess?.(data);
                } else {
                  onPaymentError?.(data);
                }
              } catch (error) {
                onPaymentError?.(error);
              } finally {
                setIsLoading(false);
              }
            },
            onFetching: (resource) => {
              console.log("Fetching resource: ", resource);
              setIsLoading(true);
              return () => setIsLoading(false);
            }
          },
        });
      } catch (error) {
        console.error("Error initializing MercadoPago:", error);
        onPaymentError?.(error);
      }
    };

    initializeMercadoPago();
  }, [amount, onPaymentSuccess, onPaymentError]);

  return (
    <div className="max-w-md mx-auto p-6">
      <form id="form-checkout" className="space-y-4">
        <div id="form-checkout__cardNumber" className="h-10 border rounded-md p-2"></div>
        <div id="form-checkout__expirationDate" className="h-10 border rounded-md p-2"></div>
        <div id="form-checkout__securityCode" className="h-10 border rounded-md p-2"></div>
        <input
          type="text"
          id="form-checkout__cardholderName"
          className="w-full h-10 border rounded-md p-2"
          placeholder="Titular do cartão"
        />
        <select id="form-checkout__issuer" className="w-full h-10 border rounded-md p-2"></select>
        <select id="form-checkout__installments" className="w-full h-10 border rounded-md p-2"></select>
        <select id="form-checkout__identificationType" className="w-full h-10 border rounded-md p-2"></select>
        <input
          type="text"
          id="form-checkout__identificationNumber"
          className="w-full h-10 border rounded-md p-2"
          placeholder="Número do documento"
        />
        <input
          type="email"
          id="form-checkout__cardholderEmail"
          className="w-full h-10 border rounded-md p-2"
          placeholder="E-mail"
        />

        <button
          type="submit"
          id="form-checkout__submit"
          className="w-full h-10 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Processando..." : "Pagar"}
        </button>
      </form>
    </div>
  );
} 