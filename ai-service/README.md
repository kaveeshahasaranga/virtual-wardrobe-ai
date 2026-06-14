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

After changing requirements (e.g. adding gradio_client), re-run:
```bash
pip install -r requirements.txt
```

> Note: The `venv/` directory is now gitignored. A `Dockerfile` is provided for containerized runs.

## Docker

The service is built and run automatically via the root `docker compose up --build`.

## Key Endpoints

- `POST /analyze-user` — Pose + body shape + skin tone (combined)
- `POST /try-on` — **Real** virtual try-on powered by IDM-VTON on Hugging Face Spaces (as recommended in the research report)
- `POST /recommendations` — Body/skin-aware outfit suggestions

**Note:** The try-on now calls the public `yisol/IDM-VTON` Space via `gradio_client`. This can take 20-60 seconds depending on the queue.

See the main research report for the recommended models (IDM-VTON, StableVITON, FashionCLIP, etc.).
