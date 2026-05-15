import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("127.0.0.1"),
  CORS_ORIGIN: z.string().default("http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5174,http://localhost:5174"),
  UPBIT_API_BASE_URL: z.string().url().default("https://api.upbit.com/v1"),
});

export const config = envSchema.parse(process.env);

export const corsOrigins = config.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
