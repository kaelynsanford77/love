FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

# Copy source
COPY . .

# Build
RUN bun build src/index.ts --outdir dist --target bun

# Run
EXPOSE 4000
ENV PORT=4000
CMD ["bun", "dist/index.js"]
