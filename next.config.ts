import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  async redirects() {
    return [
      {
        source: '/flow',
        destination: '/cheffia-flow',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/sign-in',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/sign-in',
        permanent: true,
      },
    ]
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.cosmicjs.com',
      },
      {
        protocol: 'https',
        hostname: 'imgix.cosmicjs.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_PROJECT_ID: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
};

// module.exports = {
//   async redirects() {
//     return [
//       {
//         source: '/flow',
//         destination: '/cheffia-flow',
//         permanent: true,
//       },
//       {
//         source: '/login',
//         destination: '/sign-in',
//         permanent: true,
//       },
//       {
//         source: '/signin',
//         destination: '/sign-in',
//         permanent: true,
//       },
//     ]
//   },
//   reactStrictMode: true,
//   experimental: {
//     authInterrupts: true,
//   },
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'cdn.cosmicjs.com',
//       },
//       {
//         protocol: 'https',
//         hostname: 'imgix.cosmicjs.com',
//       },
//     ],
//   },
//   env: {
//     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
//     NEXT_PUBLIC_SUPABASE_PROJECT_ID: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID,
//     NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
//     SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
//   },
// };

export default nextConfig;
