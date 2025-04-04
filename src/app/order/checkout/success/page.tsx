import Link from 'next/link';
import Image from 'next/image';
import { stripe } from '@/utils/stripe';
import { redirect } from 'next/navigation';
import InfoIcon from '@/assets/InfoIcon.svg';
import ErrorIcon from '@/assets/ErrorIcon.svg';
import SuccessIcon from '@/assets/SuccessIcon.svg';

type PaymentStatus = 'succeeded' | 'processing' | 'requires_payment_method' | 'default';

const STATUS_CONTENT_MAP: Record<PaymentStatus, { text: string; iconColor: string; icon: any }> = {
  succeeded: {
    text: "Pagamento realizado com sucesso",
    iconColor: "#30B130",
    icon: SuccessIcon,
  },
  processing: {
    text: "Seu pagamento está sendo processado.",
    iconColor: "#6D6E78",
    icon: InfoIcon,
  },
  requires_payment_method: {
    text: "Seu pagamento não foi bem-sucedido, tente novamente.",
    iconColor: "#DF1B41",
    icon: ErrorIcon,
  },
  default: {
    text: "Algo deu errado, tente novamente.",
    iconColor: "#DF1B41",
    icon: ErrorIcon,
  },
};

interface SuccessPageProps {
  searchParams: Promise<{
    payment_intent?: string | undefined;
  }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  try {
    const resolvedSearchParams = await searchParams;
    const paymentIntentId = resolvedSearchParams.payment_intent;

    if (!paymentIntentId) {
      redirect('/');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const { status } = paymentIntent as { status: PaymentStatus };

    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 border-2 rounded-xl p-8 rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: STATUS_CONTENT_MAP[status]?.iconColor || STATUS_CONTENT_MAP.default.iconColor }}
            >
              <Image
                src={STATUS_CONTENT_MAP[status]?.icon || STATUS_CONTENT_MAP.default.icon}
                alt="Status Icon"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>

            <h2 className="text-2xl font-bold text-foreground text-center mb-6">
              {STATUS_CONTENT_MAP[status]?.text || STATUS_CONTENT_MAP.default.text}
            </h2>

            <div className="w-full border-t border-secondary pt-6">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-2 text-sm font-medium text-secondary">ID</td>
                    <td className="py-2 text-sm text-foreground text-right">{paymentIntentId}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm font-medium text-secondary">Status</td>
                    <td className="py-2 text-sm text-foreground text-right">{status}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Link
              href={`https://dashboard.stripe.com/test/payments/${paymentIntentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6  hover:text-secondary flex items-center"
            >
              Ver detalhes
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>

            <Link
              href="/"
              className="mt-6 w-full bg-button-solid text-button py-3 px-4 rounded-md font-semibold transition-colors text-center rounded-xl"
            >
              Tentar novamente
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Erro ao recuperar o pagamento:', error);
    redirect('/');
  }
}