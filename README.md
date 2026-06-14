# AI-Powered Virtual Wardrobe & Personalized Fashion Recommendation System

Full-stack prototype implementing the architecture and research directions from the comprehensive 2026 research report.

## Quick Start (Recommended Order)

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

Runs on http://localhost:5000

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
- Real diffusion model integration (Hugging Face or local)
- Firebase Auth + Storage
- MongoDB for user profiles, wardrobe, history
- Trend forecasting module
- Better XAI visualizations (attention, explanations)
- Docker Compose for easy one-command startup

## Environment

Copy `.env.example` to `.env` in relevant folders as needed.

AI_SERVICE_URL=http://localhost:8000   (used by backend)

## Notes

- The virtual try-on currently returns demo images. See the research report for recommended models (IDM-VTON, StableVITON, etc.).
- Skin tone and body shape detection are practical implementations for the "Personalized Outfit Recommendation" and "Virtual Try-On" components.
- This is a working research prototype — ready for extension toward publication-quality contributions.

Report file: `../AI_Powered_Virtual_Wardrobe_Fashion_Research_Report.md`
