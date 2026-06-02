# ─────────────────────────────────────────────────────────────────────────────
# frontend/Dockerfile — Development
# ─────────────────────────────────────────────────────────────────────────────
#
# WHAT THIS DOES:
#   Runs the React/Vite development server inside a container.
#   Vite watches for file changes and automatically refreshes the browser.
#
# ─────────────────────────────────────────────────────────────────────────────

# Step 1: Start from official Node.js 22 slim image
FROM node:22-alpine

# Step 2: Set working directory inside the container
WORKDIR /app

# Step 3: Copy package files first (for Docker layer caching)
# If package.json hasn't changed, Docker skips the npm install step
COPY package.json package-lock.json* ./

# Step 4: Install all Node.js dependencies
RUN npm install

# Step 5: Copy all frontend source code
COPY . .

# Step 6: Tell Docker what port Vite listens on
EXPOSE 5173

# Step 7: Start the Vite development server
# --host 0.0.0.0 is required so the server is accessible from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
