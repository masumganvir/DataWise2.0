# DataWise AI — Production Deployment Guide

## 1. System Requirements & Architecture
- **Operating System**: Linux (Ubuntu 22.04 LTS / Debian 12 recommended) or Windows Server / Docker container.
- **Python**: Python 3.11+
- **Node.js**: Node 18+ or Node 20 LTS
- **Database**: PostgreSQL 15+ (Supabase Managed PostgreSQL recommended with RLS enabled)
- **Cache**: Redis 7.x

---

## 2. Deployment Steps

### Step 1: Database Setup & RLS Migration
Apply `backend/database/supabase_master_schema.sql` and `backend/database/rls.sql` in the Supabase SQL Editor:
```sql
-- Ensure sole admin function is installed
CREATE OR REPLACE FUNCTION public.is_database_admin()
RETURNS boolean AS $$
BEGIN
  RETURN LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'masumganvir2006@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2: Backend Deployment
1. Navigate to `backend/`:
   ```bash
   python -m venv .venv
   source .venv/bin/activate # or .\.venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
2. Configure `.env` with production settings:
   ```env
   APP_ENV=production
   IS_PRODUCTION=true
   STRICT_GMAIL=true
   JWT_SECRET_KEY=<generate-strong-64-char-random-key>
   DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
3. Start Uvicorn production server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers
   ```

### Step 3: Frontend Deployment
1. Navigate to `frontend/`:
   ```bash
   npm install --frozen-lockfile
   npm run build
   ```
2. Serve the generated `dist/` directory via Nginx, Vercel, or AWS CloudFront.
