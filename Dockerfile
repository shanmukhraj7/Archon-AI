# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /web
# Use --link for faster builds if supported
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for WeasyPrint (PDF generation)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libffi-dev \
    libcairo2 \
    libgdk-pixbuf-xlib-2.0-0 \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ /app/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /web/dist /app/frontend/dist

# Set up environment variables
ENV FRONTEND_PATH=/app/frontend/dist
ENV CHROMA_PERSIST_DIR=/app/data/chroma
ENV SQLITE_DB_PATH=/app/data/history.db
ENV UPLOAD_DIR=/app/data/uploads
ENV PORT=8000

# Ensure data directory exists
RUN mkdir -p /app/data/chroma /app/data/uploads

EXPOSE 8000

# Start the application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
