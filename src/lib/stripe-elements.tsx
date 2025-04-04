// import { Elements } from '@stripe/react-stripe-js';
// import { stripePromise } from './stripe';
// import { ReactNode } from 'react';
// import React from 'react';

// interface StripeElementsProps {
//   clientSecret: string;
//   children: ReactNode;
// }

// export function StripeElements({ clientSecret, children }: StripeElementsProps) {
//   const appearance = {
//     theme: 'stripe' as const,
//     variables: {
//       colorPrimary: '#0055DE',
//       colorBackground: '#ffffff',
//       colorText: '#30313D',
//       colorDanger: '#DF1B41',
//       fontFamily: 'system-ui, sans-serif',
//       spacingUnit: '4px',
//       borderRadius: '4px',
//     },
//   };

//   return (
//     <Elements
//       stripe={stripePromise}
//       options={{
//         clientSecret,
//         appearance,
//       }}
//     >
//       {children}
//     </Elements>
//   );
// } 

// TODO: verificar remoção