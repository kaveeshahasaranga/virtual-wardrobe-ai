# WardrobeAI - AI Microservice

Python FastAPI service handling:

- Pose estimation & body shape analysis (MediaPipe)
- Skin tone detection (future)
- Virtual Try-On (diffusion models)
- Recommendation scoring
- Trend signals

## Run locally

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Key Endpoints

- `POST /analyze-pose` — Body pose + simple shape classification
- `POST /try-on` — Virtual try-on (currently returns placeholder; connect real model)

See the main research report for the recommended models (IDM-VTON, StableVITON, FashionCLIP, etc.).
