import type { NextConfig } from "next";
import createMDX from '@next/mdx';
import { config } from 'dotenv';
import path from 'node:path';

// Better Auth debe consultar exactamente la misma base que Nest. Next puede
// cargar el .env raíz antes de este archivo, por lo que DATABASE_URL se fija
// explícitamente desde backend/.env sin importar PORT ni FRONTEND_URL.
const backendEnv = config({ path: '../backend/.env', processEnv: {}, quiet: true }).parsed;
if (backendEnv?.DATABASE_URL && !process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = backendEnv.DATABASE_URL;

// BETTER_AUTH_SECRET se conserva en el entorno raíz sin duplicarlo.
config({ path: '../.env', override: false, quiet: true });

const nextConfig: NextConfig = {
  ...(process.env.TEST_DATABASE_URL ? { distDir: ".next-calendar-review" } : {}),
  serverExternalPackages: ['@prisma/client', 'prisma', 'better-auth'],
  outputFileTracingRoot: path.join(__dirname, '..'),
};

// Las guías internas (content/guides/*.mdx) se importan como componentes.
// Con Turbopack los plugins van por nombre y con opciones serializables.
// remark-gfm agrega tablas, tachado y enlaces automáticos.
const withMDX = createMDX({ options: { remarkPlugins: ['remark-gfm'] } });

export default withMDX(nextConfig);
