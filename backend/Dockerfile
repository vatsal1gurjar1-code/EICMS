# ─────────────────────────────────────────────────────────────────────────────
# backend/Dockerfile — Development
# ─────────────────────────────────────────────────────────────────────────────
#
# WHAT THIS DOES (step by step):
#
#   1. FROM python:3.12-slim
#      Start from an official Python 3.12 image (slim = smaller size)
#
#   2. WORKDIR /app
#      Set the working directory inside the container to /app
#      All commands from here run inside /app
#
#   3. COPY requirements.txt .
#      Copy just the requirements file first (before copying all code)
#      This is a Docker best-practice: if requirements don't change,
#      Docker caches this layer and doesn't reinstall packages every time
#
#   4. RUN pip install --no-cache-dir -r requirements.txt
#      Install all Python packages listed in requirements.txt
#
#   5. COPY . .
#      Copy all backend code into the container
#      (In development, this is overridden by the volume mount in docker-compose.yml)
#
# ─────────────────────────────────────────────────────────────────────────────

# Step 1: Start from official Python 3.12 slim image
FROM python:3.12-slim

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Install system dependencies needed by some Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Step 4: Copy requirements file first (for Docker layer caching)
COPY requirements.txt .

# Step 5: Install all Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Step 6: Copy all backend source code into the container
COPY . .

# Step 7: Tell Docker what port this container listens on
EXPOSE 8000

# Step 8: Default command (overridden by docker-compose.yml)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
