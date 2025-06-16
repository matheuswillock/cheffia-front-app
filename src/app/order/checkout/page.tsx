"use client";

import { handleCreatePaymentIntent } from "@/business/payments/paymentsBusiness";
import CheckoutForm from "./container/Checkout";
import { stripePromise } from "@/utils/stripe";
import { Elements } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";

export default function Checkout() {
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        setLoading(true);
        const result = await handleCreatePaymentIntent();
        
        if (result && result.clientSecret) {
          setClientSecret(result.clientSecret);
        } else {
          setError("Não foi possível obter os dados de pagamento. Tente novamente.");
        }
      } catch (err) {
        setError("Erro ao processar pagamento. Por favor, tente novamente mais tarde.");
        console.error("Erro no pagamento:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentIntent();
  }, []);

  const options = {
    clientSecret,
    appearance: {
      theme: "night" as const,
      variables: {
        colorPrimary: '#23CF90',
        colorBackground: '#2D2D2D',
        colorText: '#EAEAEA',
      },
    },
    loader: "auto" as const,
    googlePay: {
      merchantCountry: 'BR',
      testEnv: process.env.NODE_ENV !== 'production'
    },
    applePay: {
      merchantCountry: 'BR',
      merchantCapabilities: ['supports3DS'],
      buttonType: 'buy'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm />
    </Elements>
  );
}


