FROM node:18 as builder

ENV NODE_ENV development

WORKDIR /build

COPY pnpm-lock.yaml .

RUN apt update && apt upgrade -y && apt install -y \
    g++ \
    cpp \
    python3

RUN npm i -g pnpm

COPY package.json .

RUN pnpm install --frozen-lockfile --non-interactive

COPY src /build/src

COPY ormconfig.ts tsconfig.json ./

RUN pnpm run build

FROM node:18 as app

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /build/dist /app/dist
COPY --from=builder /build/package.json /app/package.json
COPY --from=builder /build/pnpm-lock.yaml .

RUN pnpm install --frozen-lockfile --non-interactive

CMD ["pnpm", "run", "start"]
