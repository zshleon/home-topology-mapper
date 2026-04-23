FROM node:22-slim AS frontend-build
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime
ENV PYTHONUNBUFFERED=1 \
    HTM_HOST=0.0.0.0 \
    HTM_PORT=8080 \
    HTM_STATIC_DIR=/app/static

RUN apt-get update \
    && apt-get install -y --no-install-recommends nmap iproute2 iputils-ping netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/ /app/backend/
RUN pip install --no-cache-dir /app/backend
COPY --from=frontend-build /src/frontend/dist /app/static

EXPOSE 8080
VOLUME ["/data"]
CMD ["sh", "-c", "uvicorn app.main:app --host ${HTM_HOST:-0.0.0.0} --port ${HTM_PORT:-8080}"]
