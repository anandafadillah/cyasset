# Multi-stage build. TIDAK pakai output: "standalone" (lihat next.config.ts)
# — image akhir jalan lewat `next start` biasa dengan node_modules produksi
# penuh, supaya public/uploads yang ditambah SETELAH build (foto yang
# di-upload user saat aplikasi jalan) tetap tersaji dengan benar.
# Next.js 16 mensyaratkan Node >=20.9.0 (lihat node_modules/next/package.json).

FROM node:22-alpine AS deps
WORKDIR /app
# npm bawaan image ini kadang lebih lama dari npm yang men-generate
# package-lock.json (lockfileVersion 3, optional deps per-platform) — upgrade
# dulu supaya `npm ci` tidak salah anggap paket hilang.
RUN npm install -g npm@latest
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g npm@latest
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Env dummy hanya supaya `next build` (yang membaca process.env.APP_URL saat
# prerendering) tidak gagal — nilai asli di-supply saat container jalan lewat
# docker-compose env_file, next start membaca ulang process.env saat runtime.
ENV APP_URL="http://localhost:3000"
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV AUTH_SECRET="placeholder-build-time-only"
RUN npm run build

# Stage "tools" (dipakai docker-compose.prod.yml lewat `docker compose run
# --rm tools <perintah>` untuk migrasi/seed) tetap pakai image `builder` ini
# apa adanya karena masih punya devDependencies penuh (drizzle-kit, tsx).

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Folder foto upload (modul Barang/Prasarana) — di-mount sebagai volume lewat
# docker-compose.prod.yml supaya persist & langsung tersaji tanpa rebuild.
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
