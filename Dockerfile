FROM node:20-alpine

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# Copy project files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts

# Install dependencies and build api-server
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
