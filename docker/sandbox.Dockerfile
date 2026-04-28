FROM oven/bun:1.1 AS base
WORKDIR /app

# Install Node.js for running IDE build
RUN apt-get update && apt-get install -y nodejs npm git && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lockb* ./
COPY apps/orchestrator/package.json apps/orchestrator/
COPY apps/ide/package.json apps/ide/

# Install dependencies
RUN bun install

# Copy source
COPY . .

# Build IDE
RUN bun run --cwd apps/ide build

# Expose ports
EXPOSE 3000 4000

CMD ["bun", "run", "--cwd", "apps/orchestrator", "dev"]
