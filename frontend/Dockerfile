# Sử dụng Node.js 22 Alpine làm base image
FROM node:22-alpine AS base

# Install dependencies chỉ khi cần thiết
FROM base AS deps
# Kiểm tra https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine để hiểu tại sao libc6-compat có thể cần thiết.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Cài đặt dependencies dựa trên package manager ưa thích
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "package-lock.json not found." && exit 1; \
  fi

# Rebuild source code chỉ khi cần thiết
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry trong build
ENV NEXT_TELEMETRY_DISABLED 1

# Build ứng dụng
RUN npm run build

# Production image, copy tất cả files và chạy next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Tạo user nextjs để chạy ứng dụng
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy các file cần thiết từ builder stage
COPY --from=builder /app/public ./public

# Set quyền cho prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Tự động tận dụng output traces để giảm kích thước image
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Server.js được tạo bởi next build từ output standalone
CMD ["node", "server.js"]