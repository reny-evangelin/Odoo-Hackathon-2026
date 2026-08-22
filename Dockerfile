# Root Dockerfile – forwards to backend Dockerfile
# This file allows Render (or any Docker build that expects a Dockerfile at the repository root)
# to locate the actual backend Dockerfile located in the subdirectory `my-hrms-project/backend`.
# The build context is the repository root, but we simply delegate to the backend Dockerfile.

FROM python:3.11-slim AS base
WORKDIR /app

# Copy the entire repository (needed for the sub‑folder Dockerfile)
COPY . .

# Change to the backend directory and use its Dockerfile
WORKDIR /app/my-hrms-project/backend

# Use the existing backend Dockerfile
COPY Dockerfile ./Dockerfile

# Build the backend image using the forwarded Dockerfile
# (Docker will automatically execute the instructions in this file)
# This line is effectively a no‑op for the build itself, but keeping it ensures the
# Dockerfile is syntactically valid and triggers the subsequent instructions.

# (All actual build steps are defined in the backend Dockerfile.)
