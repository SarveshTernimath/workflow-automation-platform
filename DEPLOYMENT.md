# Deployment Guide

This document provides step-by-step instructions for deploying the Workflow Automation Platform in different environments.

## 📋 Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Docker & Docker Compose** (for containerized deployment)
- **PostgreSQL** instance
- **Redis** instance (for Celery)

---

## 🛠 Manual Deployment (Standard)

### 1. Backend Setup

1. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   # OR
   venv\Scripts\activate     # Windows
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your production values:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/workflow_db
   SECRET_KEY=generate-a-strong-random-key
   REDIS_URL=redis://localhost:6379/0
   ```
   **CRITICAL**: Change the `SECRET_KEY` and ensure `ENVIRONMENT=production` in actual deployment.

4. **Run Database Migrations**:
   ```bash
   alembic upgrade head
   ```

5. **Bootstrap the System**:
   Initialize the default roles and admin user:
   ```bash
   python scripts/bootstrap.py
   ```

6. **Start the API Server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers
   ```

7. **Start Celery Workers**:
   ```bash
   celery -A app.tasks.celery_app worker --loglevel=info
   celery -A app.tasks.celery_app beat --loglevel=info
   ```

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Ensure `NEXT_PUBLIC_API_URL` points to your backend:
   ```bash
   NEXT_PUBLIC_API_URL=http://your-server-ip:8000/api/v1
   ```

4. **Build and Start**:
   ```bash
   npm run build
   npm start
   ```

---

## 🐳 Containerized Deployment (Recommended)

The platform comes with full Docker support for unified management.

1. **Build and start all services**:
   ```bash
   docker-compose up -d --build
   ```

2. **Verify services are running**:
   ```bash
   docker-compose ps
   ```

This will spin up:
- **Backend (API)**
- **Worker & Beat** (Celery)
- **Frontend** (Next.js)
- **PostgreSQL**
- **Redis**

---

## 🛡 Security Best Practices

### 1. Environment Secrets
- Never commit your `.env` file to version control.
- Use a dedicated secrets manager in cloud environments (AWS Secrets Manager, HashiCorp Vault).

### 2. CORS Restriction
By default, `BACKEND_CORS_ORIGINS` is set to `["*"]`. In production, restrict this to your frontend domain:
```bash
BACKEND_CORS_ORIGINS=["https://workflow.yourcompany.com"]
```

### 3. Database
- Ensure SSL is enabled for remote database connections.
- Use restricted database users with minimal necessary permissions.

### 4. Reverse Proxy
It is highly recommended to run the platform behind a reverse proxy like **Nginx** or **Traefik** to handle SSL termination and load balancing.

## 🌌 Premium UI & Experience

The platform features a high-fidelity, industry-grade interface built with:
- **Tailwind CSS v4**: Leveraging modern CSS variables and high-performance styling.
- **Glassmorphism**: Using `backdrop-blur` and semi-transparent layers for a prestigious feel.
- **Framer Motion**: Powering smooth page transitions and micro-interactions.

### ⚡ Performance Optimizations
- **Adaptive Loading**: UI elements use motion-placeholder states while fetching backend telemetry.
- **Asset Optimization**: Lucide-react icons are tree-shaken for minimal bundle size.
- **Radial Gradients**: Native CSS gradients are used over high-res background images to ensure 60fps scrolling.

---

## 🔍 Health Monitoring

- **API Health**: `GET /health`
- **Interactive Documentation**: `GET /docs` (FastAPI Swagger)
- **Telemetry Indicators**: Real-time latency and uptime tracking available in the UI header.
- **Audit Logs**: Full system-wide traceability through the Operational Ledger.
