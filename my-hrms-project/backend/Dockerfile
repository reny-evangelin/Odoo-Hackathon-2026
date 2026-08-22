FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Prevent Python from writing bytecode files and force unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies (if any are needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Set default port (can be overridden by environment variable)
ENV PORT=5000

# Expose the port the app runs on
EXPOSE 5000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

# Start Uvicorn server
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-5000}"
