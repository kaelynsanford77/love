FROM node:20-slim

RUN apt-get update && apt-get install -y \
  git \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app

COPY package.json ./
RUN bun install

COPY tsconfig.json ./
COPY src ./src

RUN bun run build

RUN mkdir -p /data/projects

ENV NODE_ENV=production
ENV PROJECTS_DIR=/data/projects
ENV DB_PATH=/data/love.db

EXPOSE 3001

CMD ["node", "dist/index.js"]
