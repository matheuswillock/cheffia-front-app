import { NextResponse } from 'next/server';
import MercadoPagoConfig, { AccessToken } from 'mercadopago/config';
import { Client, Payment } from 'mercadopago';

const client = new Client({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const paymentRequest = {
      transaction_amount: body.transaction_amount,
      token: body.token,
      description: body.description,
      installments: body.installments,
      payment_method_id: body.payment_method_id,
      payer: {
        email: body.payer.email,
        identification: {
          type: body.payer.identification.type,
          number: body.payer.identification.number,
        },
      },
    };

    const payment = await client.payment.create({
      body: paymentRequest,
    });

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar pagamento' },
      { status: 400 }
    );
  }
} 