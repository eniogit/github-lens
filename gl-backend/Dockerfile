FROM node:22.14.0

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack use pnpm

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

CMD ["pnpm", "start:prod"]