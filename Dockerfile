FROM node:17 as builder

ENV NODE_ENV development

WORKDIR /build

COPY yarn.lock yarn.lock

RUN apt update && apt upgrade -y && apt install -y \
    g++ \
    cpp \
    python3

COPY package.json package.json

RUN yarn install --frozen-lockfile --non-interactive

COPY src /build/src

COPY ormconfig.ts /build/ormconfig.ts

COPY tsconfig.json /build/tsconfig.json

RUN yarn run build

FROM node:17 as app

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /build/dist /app/dist
COPY --from=builder /build/package.json /app/package.json
COPY --from=builder /build/yarn.lock /app/yarn.lock

RUN yarn install --frozen-lockfile --non-interactive

CMD ["yarn", "run", "start"]
