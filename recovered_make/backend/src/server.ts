import Fastify from "fastify";
import cors from "@fastify/cors";
import { config, corsOrigins } from "./config.js";
import { checkDatabase, prisma } from "./db.js";
import { registerCandleRoutes } from "./routes/candles.js";
import { registerMarketRoutes } from "./routes/markets.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed: ${origin}`), false);
  },
});

app.get("/health", async () => ({
  status: "ok",
  service: "rmi-backtest-backend",
  timestamp: new Date().toISOString(),
}));

app.get("/health/db", async (_request, reply) => {
  if (!config.DATABASE_URL) {
    return reply.code(503).send({
      status: "error",
      database: "missing DATABASE_URL",
    });
  }

  try {
    await checkDatabase();
    return {
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    app.log.error(error);
    return reply.code(503).send({
      status: "error",
      database: "unavailable",
    });
  }
});

await registerMarketRoutes(app);
await registerCandleRoutes(app);

app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
