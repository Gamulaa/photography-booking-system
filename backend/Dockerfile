# Stage 1: Install dependencies & compile TypeScript
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Compile seed script for zero-devDependency production seeding
RUN npx tsc prisma/seed.ts \
  --outDir dist-seed \
  --module CommonJS \
  --target ES2022 \
  --esModuleInterop \
  --skipLibCheck

# Stage 2: Production runtime
FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Install prisma CLI only for running migrate deploy on boot
COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-seed ./dist-seed

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]