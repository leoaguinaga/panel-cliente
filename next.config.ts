import type { NextConfig } from "next";
import { config } from 'dotenv';
import path from 'node:path';

// Better Auth debe consultar exactamente la misma base que Nest. Next puede
// cargar el .env raíz antes de este archivo, por lo que DATABASE_URL se fija
// explícitamente desde backend/.env sin importar PORT ni FRONTEND_URL.
const backendEnv = config({ path: '../backend/.env', processEnv: {}, quiet: true }).parsed;
if (backendEnv?.DATABASE_URL) process.env.DATABASE_URL = backendEnv.DATABASE_URL;

// BETTER_AUTH_SECRET se conserva en el entorno raíz sin duplicarlo.
config({ path: '../.env', override: false, quiet: true });

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma', 'better-auth'],
  outputFileTracingRoot: path.join(__dirname, '..'),
};

export default nextConfig;
