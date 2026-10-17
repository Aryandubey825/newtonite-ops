FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push && npx tsx prisma/seed.ts && node dist/index.js"]
