# =============================================================================
# Dayflow HRMS — Single-Container Production Dockerfile
# Serves FastAPI backend + static React SPA on port 5000
# =============================================================================

FROM python:3.11-slim

# Runtime environment configuration
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000

WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY my-hrms-project/backend/requirements.txt .
RUN pip install --no-cache-dir --default-timeout=120 -r requirements.txt

# Copy application source code (including static SPA bundle)
COPY my-hrms-project/backend/ .

# Expose server port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start FastAPI application with Uvicorn server
CMD ["python", "main.py"]
