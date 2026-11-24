import app from "./app";
import { prisma } from "./config/db";
import { env } from "./config/env";

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL successfully.");

    const server = app.listen(env.PORT, () => {
      console.log(
        `Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`,
      );
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
