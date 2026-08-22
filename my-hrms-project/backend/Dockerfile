FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Prevent Python from writing bytecode files & force unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Default port environment variable
ENV PORT=5000

# Expose server port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

# Start Uvicorn application server with dynamic PORT environment variable
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-5000}"
