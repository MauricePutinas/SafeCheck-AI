/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Die App verarbeitet Eingaben primaer lokal/regelbasiert.
  // Keine externen KI-APIs noetig.
  experimental: {
    // Prisma-Client wird serverseitig genutzt.
  },
};

export default nextConfig;
