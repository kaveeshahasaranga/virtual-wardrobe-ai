# AI-Powered Virtual Wardrobe & Personalized Fashion Recommendation System

Full-stack prototype implementing the architecture and research directions from the comprehensive 2026 research report.

## Quick Start with Docker (Recommended)

This is now the easiest way to run the full backend stack.

```bash
# 1. Copy env (optional but recommended)
cp .env.example .env

# 2. Start the AI service + backend gateway
docker compose up --build

# 3. In a separate terminal, start the frontend (best for hot-reload during development)
cd client && npm run dev
```

- AI service: http://localhost:8000/docs
- Backend gateway: http://localhost:5001/api/health
- Frontend: http://localhost:5173

> **Note:** The first `docker compose up --build` can take a few minutes (it installs heavy ML dependencies for MediaPipe/OpenCV).

## Quick Start (Manual / Development)

### 1. AI Service (Python + MediaPipe + FastAPI)

### 1. AI Service (Python + MediaPipe + FastAPI)
This powers pose estimation, body shape, skin tone detection, and (placeholder) virtual try-on.

```bash
cd ai-service

# Activate venv (created earlier)
source venv/bin/activate

# If you need to re-install:
# pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

Test it: Visit http://localhost:8000/docs

### 2. Backend (Express API Gateway)
Routes requests to the AI service and will eventually handle MongoDB, Firebase, auth, etc.

```bash
cd server
npm install          # if not already done
npm run dev
```

Runs on http://localhost:5001 (default)

### 3. Frontend (React)
```bash
cd client
npm run dev
```

Open http://localhost:5173 (usually).

## Key Features Implemented So Far

- **Virtual Try-On page** (`/wardrobe`): 
  - Upload photo or (demo) webcam
  - Select garment
  - Real call to AI service via backend gateway for **pose + body shape + skin tone analysis**
  - Generates virtual try-on result (currently high-quality placeholder; wired for real diffusion models)

- **Outfit Builder** (`/outfits`):
  - "Analyze & Recommend" demo that uses body/skin data to return personalized outfit suggestions (stub for FashionCLIP + hybrid recs)

- **AI Service endpoints** (see ai-service/main.py):
  - `/analyze-user` → Combined pose, body type, skin tone (Fitzpatrick-inspired)
  - `/try-on` → Ready for IDM-VTON / StableVITON style diffusion
  - `/recommendations` → Body + skin aware suggestions

- Clean modern UI with navigation matching the proposed system.

## Architecture Alignment (from Research Report)

- Frontend: React (MERN)
- Backend: Express as API gateway
- AI: FastAPI microservice (MediaPipe for pose/body, skin tone heuristics, future diffusion + FashionCLIP)
- Data flow: User photo → Backend → AI service (pose/skin) → Try-on / Recs

Next milestones (see todo list in development):
- Real diffusion model integration (Hugging Face or local) — *partial via IDM-VTON*
- Firebase Auth + Storage
- ~~MongoDB for user profiles, wardrobe, history~~ ✅ (basic persistence implemented)
- Trend forecasting module
- Better XAI visualizations (attention, explanations)
- ~~Docker Compose for easy one-command startup~~ ✅ (completed in foundation pass)

## Environment

Copy `.env.example` to `.env` (at project root) as needed.

Key variables:
- `AI_SERVICE_URL` — used by the Express server to reach the AI microservice
- `VITE_BACKEND_URL` — used by the React client
- `PORT` — backend port (defaults to 5001)

A root `.gitignore` was added to prevent committing `node_modules/`, Python `venv/`, `.env*` files, etc.

## Docker Notes
- Dockerfiles exist for both `server/` and `ai-service/`.
- `docker compose up --build` brings up the two backend services with healthchecks.
- The frontend is intentionally left out of compose for now (Vite dev server + HMR works better locally).
- To rebuild after code changes: `docker compose up --build --force-recreate`

## Development Tips
- Run services individually when actively editing (faster iteration than Docker rebuilds).
- The AI service try-on calls can take 20-60s (public HF Space queue). This is expected.

## Notes

- The virtual try-on now calls a **real model**: IDM-VTON via the public Hugging Face Space (`yisol/IDM-VTON`) using `gradio_client`. This matches the diffusion-based approach highlighted in the research report. Calls can take 20–60s due to the shared queue.
- Skin tone and body shape detection are practical implementations for the "Personalized Outfit Recommendation" and "Virtual Try-On" components.
- This is a working research prototype — ready for extension toward publication-quality contributions.

Report file: `../AI_Powered_Virtual_Wardrobe_Fashion_Research_Report.md`
