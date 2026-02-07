# 🛠️ Fix Login: Force Re-Deploy Frontend

Your frontend is likely "stuck" using the old settings (localhost). Next.js needs a **Manual Redeploy** to save the Backend URL you just added.

### 1. Go to Render Dashboard
1.  Click on your **Frontend Service** (`antigravity-frontend`).
2.  Click **Environment** (Left sidebar).
3.  **Verify**: You should see:
    *   `NEXT_PUBLIC_API_URL` = `https://antigravity-backend.onrender.com` (Check for typos!)

### 2. Force a Manual Deploy (CRITICAL)
Adding variable isn't enough. You must Re-Build.
1.  Click **Manual Deploy** (Top Right button).
2.  Select **Clear Build Cache & Deploy**.
    *   *This forces Next.js to "bake in" your new Backend URL.*

### 3. Verify Backend is Healthy
1.  Open this URL in a new tab: `https://antigravity-backend.onrender.com/health`
2.  You should see: `{"status":"healthy", ...}`
    *   *If this fails, your Backend is not running or URL is wrong.*

### 4. Try Login Again
1.  **Wait** for Frontend deploy to finish (green checkmark).
2.  Refresh your Frontend page.
3.  Login: `admin@example.com` / `admin123`

---
**Why this happens:** React apps are "static". They capture the environment variables *only* when you click "Build". If you added the variable *after* the first build, the app doesn't know about it yet.
