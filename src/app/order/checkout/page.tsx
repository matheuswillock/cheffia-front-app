import { CheckoutPixContainer } from "@/app/order/checkout/features/container/CheckoutPixContainer";
import { CheckoutPixFeatureProvider } from "@/app/order/checkout/features/context/CheckoutPixContext";

interface CheckoutPageProps {
  searchParams: Promise<{
    customerOrderId?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const customerOrderId = typeof params.customerOrderId === "string" ? params.customerOrderId : null;

  return (
    <CheckoutPixFeatureProvider customerOrderId={customerOrderId}>
      <CheckoutPixContainer />
    </CheckoutPixFeatureProvider>
  );
}
