import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";

export default function CheckoutForm() {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const paymentElementOptions = {
    layout: "accordion" as const,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!stripe || !elements) {
      setMessage("Stripe não está carregado ainda.");
      return;
    }
  
    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) {
      setMessage("O elemento de pagamento não foi montado.");
      return;
    }
  
    setIsLoading(true);
  
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/checkout/success`,
      },
    });
  
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Ocorreu um erro no pagamento.");
      } else {
        setMessage("Ocorreu um erro inesperado.");
      }
    }
  
    setIsLoading(false);
  };


  return (
    <form id="payment-form" onSubmit={handleSubmit} className="p-4 max-w-[620px] mx-auto">
      <PaymentElement 
        id="payment-element" 
        options={paymentElementOptions}
      />
      <button
        disabled={!stripe || isLoading || !elements}
        id="submit"
        className="bg-primary text-button w-[80%] py-3 mt-4 rounded-xl mx-auto flex items-center justify-center hover:bg-primary/80 transition duration-300 disabled:opacity-50"
      >
        <span id="button-text">
          {isLoading ? 
            (<div className="spinner" id="spinner">Processando...</div>) : 
            "Pagar agora"
          }
        </span>
      </button>

      {message && 
        <div id="payment-message" className="mt-4 text-red-500">
          {message}
        </div>
      }
    </form>
  );
}