# Installation & Getting Started

## Prerequisites

| Requirement | Minimum Version | Purpose |
|-------------|----------------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend build and dev server |
| npm | 9+ | Frontend package management |
| Git | 2.x | Version control |
| Redis | 7.x (optional) | Caching and rate limiting (in-memory fallback available) |

## Step 1: Clone the Repository

```bash
git clone <repository-url> DataWiseAI
cd DataWiseAI
```

## Step 2: Backend Setup

### Create Python Virtual Environment

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Copy the example environment file and configure:

```bash
cp ../.env.example ../.env
```

**Required variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_ENV` | Environment mode | `development` |
| `SECRET_KEY` | JWT signing key (change in production!) | `your-secret-key-here` |
| `DATABASE_URL` | Database connection string | `sqlite+aiosqlite:///./datawise.db` |
| `GEMINI_API_KEY` | Google Gemini API key (primary LLM) | `your-gemini-key` |
| `CLERK_PUBLISHABLE_KEY` | Clerk OAuth publishable key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk OAuth secret key | `sk_test_...` |

**Optional variables (have working defaults):**

| Variable | Default |
|----------|---------|
| `APP_HOST` | `0.0.0.0` |
| `APP_PORT` | `8000` |
| `REDIS_URL` | `redis://localhost:6379/0` |
| `S3_ENDPOINT` | `http://localhost:9000` |
| `LLM_PROVIDER` | `gemini` |
| `MAX_UPLOAD_SIZE_MB` | `100` |

> ⚠️ **Never commit real API keys or secrets to version control.** The `.env` file is in `.gitignore`.

### Start the Backend

```bash
cd backend
python main.py
```

The API server starts at `http://localhost:8000`. API documentation (Swagger UI) is available at `http://localhost:8000/api/docs` in development mode.

## Step 3: Frontend Setup

### Install Node Dependencies

```bash
cd frontend
npm install
```

### Configure Frontend Environment

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
```

### Start the Frontend Dev Server

```bash
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Step 4: Verify Installation

1. Open `http://localhost:5173` — you should see the DataWise AI landing page
2. Click "Get Started" or navigate to `/login`
3. Register a new account or sign in with Clerk OAuth
4. Navigate to Projects → New Project

## Step 5: Your First Project

### Create a Project

1. Go to **Projects** → **New Project**
2. Enter a project name (e.g., "Iris Classification")
3. **Prompt A** (Problem): "I want to classify iris flowers into their species based on petal and sepal measurements"
4. **Prompt B** (Solution): "Use ensemble methods with cross-validation, optimize for accuracy, and generate a detailed report"
5. Click **Create Project**

### Upload a Dataset

1. In your project, click **Upload Dataset**
2. Select a CSV file (e.g., the Iris dataset)
3. The system automatically profiles the dataset and detects the target column

### Run Analysis

1. Click **Run Analysis** or **Start Experiment**
2. The agent pipeline executes: profiling → quality → preprocessing → training → evaluation
3. Monitor progress in the Live Workflow view or via WebSocket events
4. Review and approve decisions when prompted (e.g., outlier treatment)

### Download Results

1. After completion, navigate to the **Results** tab
2. Download artifacts:
   - Trained model (`.pkl`)
   - Fitted pipeline
   - PDF/HTML report
   - Jupyter notebook
   - ZIP bundle with all artifacts

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Ensure virtual environment is activated and requirements installed |
| CORS errors in browser | Check `CORS_ORIGINS` includes your frontend URL |
| Database locked (SQLite) | Ensure only one uvicorn worker in development |
| Clerk auth errors | Verify `CLERK_PUBLISHABLE_KEY` matches between frontend and backend |
| LLM API errors | Check `GEMINI_API_KEY` is valid; platform falls back to Groq → Cloudflare → Ollama |
| Redis connection refused | Redis is optional; the platform uses in-memory fallback |
| File upload rejected | Check file extension is in allowed list (csv, xlsx, xls, json, parquet) |
| Training timeout | Increase `MAX_TRAINING_TIME` or reduce dataset size |
