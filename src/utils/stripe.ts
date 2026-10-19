import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY não está definida');
  }

  return new Stripe(secretKey);
}
