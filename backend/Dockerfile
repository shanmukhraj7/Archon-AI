FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (WeasyPrint PDF libs + build tools)
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

COPY requirements.txt .

# Install CPU-only PyTorch FIRST (before requirements.txt) so pip doesn't
# resolve the GPU/CUDA variant pulled in by sentence-transformers.
# torch 2.6.0+cpu is the first CPU-only wheel available for ARM64 (aarch64 / Apple Silicon).
# This cuts the image size from ~3.5 GB to ~700 MB and build time by 15+ min.
RUN pip install --no-cache-dir \
    torch==2.6.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Now install the rest of the requirements (torch is already satisfied above)
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data/chroma /app/data/uploads

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]