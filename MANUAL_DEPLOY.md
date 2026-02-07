# � Deployment Cheat Sheet (Copy-Paste)

Here are the exact values to use.

### 📌 Global Settings
*   **Repository URL**: `https://github.com/SarveshTernimath/workflow-automation-platform`

---

## 1. POSTGRES SQL (Database)
*   **Internal DB URL**: *(You get this after clicking "Create" on Render)* `postgres://...`  <-- **SAVE THIS**

## 2. REDIS (Cache)
*   **Internal Redis URL**: *(You get this after clicking "Create" on Render)* `redis://...`  <-- **SAVE THIS**

---

## 3. BACKEND (Web Service)
*   **Name**: `antigravity-backend`
*   **Runtime**: `Python 3`
*   **Build Command**: `pip install -r requirements.txt`
*   **Start Command**: `bash scripts/run_free_tier.sh`
*   **Environment Variables**:
    *   `ENVIRONMENT`: `production`
    *   `SECRET_KEY`: `HOtdYpk9-ImgMN3VBWKyDR7zqKDVXwovKZgZqLGueBM`
    *   `DATABASE_URL`: *(Paste Internal DB URL from Step 1)*
    *   `CELERY_BROKER_URL`: *(Paste Internal Redis URL from Step 2)*
    *   `CELERY_RESULT_BACKEND`: *(Paste Internal Redis URL from Step 2)*

## 4. FRONTEND (Web Service)
*   **Name**: `antigravity-frontend`
*   **Runtime**: `Node`
*   **Root Directory**: `frontend`
*   **Build Command**: `npm install && npm run build`
*   **Start Command**: `npm run start`
*   **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: `https://antigravity-backend.onrender.com` *(Paste your ACTUAL Backend URL after creating Step 3)*
