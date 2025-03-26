'use client';

import { CardPaymentForm } from '@/components/payment/CardPaymentForm';
import { useState } from 'react';

export default function PaymentPage() {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [paymentMessage, setPaymentMessage] = useState('');

  const handlePaymentSuccess = (response: any) => {
    setPaymentStatus('success');
    setPaymentMessage('Pagamento processado com sucesso!');
    console.log('Payment success:', response);
  };

  const handlePaymentError = (error: any) => {
    setPaymentStatus('error');
    setPaymentMessage('Erro ao processar pagamento. Tente novamente.');
    console.error('Payment error:', error);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Pagamento com Cartão</h1>
      
      {paymentStatus === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {paymentMessage}
        </div>
      )}

      {paymentStatus === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {paymentMessage}
        </div>
      )}

      <CardPaymentForm
        amount={100.50}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </div>
  );
} 