from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import mediapipe as mp
import numpy as np
from PIL import Image
import io

app = FastAPI(title="WardrobeAI - AI Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mp_pose = mp.solutions.pose
mp_face = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils

class TryOnRequest(BaseModel):
    user_image_base64: str
    garment_id: int

class AnalysisResponse(BaseModel):
    success: bool
    body_type: str | None = None
    skin_tone: str | None = None
    skin_tone_category: str | None = None  # e.g. "Warm", "Cool", "Neutral"
    landmarks_sample: list | None = None
    message: str

@app.get("/health")
async def health():
    return {"status": "ok", "service": "WardrobeAI AI Service"}

def estimate_skin_tone(image: np.ndarray) -> tuple[str, str]:
    """Simple skin tone estimation using YCbCr or HSV sampling on likely skin regions.
    Returns (tone_description, category). Not medical grade - for demo/fashion use.
    """
    # Convert to YCrCb for better skin segmentation
    ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
    
    # Rough skin mask (common range for skin in YCrCb)
    lower = np.array([0, 133, 77], dtype=np.uint8)
    upper = np.array([255, 173, 127], dtype=np.uint8)
    skin_mask = cv2.inRange(ycrcb, lower, upper)
    
    # Apply mask
    skin_pixels = image[skin_mask > 0]
    
    if len(skin_pixels) < 100:
        return "Unknown", "Neutral"
    
    # Average RGB of skin pixels
    avg_rgb = np.mean(skin_pixels, axis=0)
    r, g, b = avg_rgb
    
    # Simple heuristics for tone depth (Fitzpatrick-inspired)
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    
    if luminance > 200:
        depth = "Very Light (Fitzpatrick I-II)"
    elif luminance > 160:
        depth = "Light (Fitzpatrick II-III)"
    elif luminance > 120:
        depth = "Medium (Fitzpatrick III-IV)"
    elif luminance > 80:
        depth = "Tan / Deep (Fitzpatrick IV-V)"
    else:
        depth = "Deep (Fitzpatrick V-VI)"
    
    # Very rough undertone (warm/cool) using red vs blue dominance
    if r > b + 15:
        undertone = "Warm"
    elif b > r + 15:
        undertone = "Cool"
    else:
        undertone = "Neutral"
    
    return depth, undertone

@app.post("/analyze-user", response_model=AnalysisResponse)
async def analyze_user(file: UploadFile = File(...)):
    """Combined analysis: Pose + Body shape + Skin tone.
    This is core for personalized try-on and recommendations per the research report.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(400, "Invalid image")
        
        results = {
            "success": True,
            "body_type": None,
            "skin_tone": None,
            "skin_tone_category": None,
            "landmarks_sample": None,
            "message": "Analysis complete"
        }
        
        # 1. Pose + Body shape (MediaPipe Pose)
        with mp_pose.Pose(static_image_mode=True, model_complexity=1, min_detection_confidence=0.5) as pose:
            pose_results = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            if pose_results.pose_landmarks:
                landmarks = []
                for i, lm in enumerate(pose_results.pose_landmarks.landmark):
                    landmarks.append({
                        "id": i, "x": round(lm.x, 4), "y": round(lm.y, 4), "visibility": round(lm.visibility, 3)
                    })
                
                # Basic body shape heuristic (shoulders vs hips)
                shoulder_w = abs(landmarks[11]['x'] - landmarks[12]['x']) if len(landmarks) > 12 else 0
                hip_w = abs(landmarks[23]['x'] - landmarks[24]['x']) if len(landmarks) > 24 else 0
                
                if shoulder_w > hip_w * 1.18:
                    body_type = "Inverted Triangle / Athletic"
                elif hip_w > shoulder_w * 1.18:
                    body_type = "Pear / Hourglass"
                else:
                    body_type = "Rectangle / Balanced"
                
                results["body_type"] = body_type
                results["landmarks_sample"] = landmarks[:12]
        
        # 2. Skin tone estimation
        skin_tone, category = estimate_skin_tone(image)
        results["skin_tone"] = skin_tone
        results["skin_tone_category"] = category
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/try-on")
async def virtual_try_on(request: TryOnRequest):
    """
    Placeholder for diffusion-based virtual try-on (IDM-VTON / StableVITON style).
    In production: forward base64 or URL to a Hugging Face endpoint or local Diffusers pipeline
    with pose mask + garment + skin/body conditioning.
    """
    # For now returns a demo image. Real integration would use the models from the literature review.
    return {
        "success": True,
        "result_image": "https://picsum.photos/id/1012/800/1000",
        "message": "Demo result. Connect real diffusion model (see research report: IDM-VTON, StableVITON, etc.).",
        "garment_id": request.garment_id,
        "conditioning_used": ["pose", "body_shape", "skin_tone"]
    }

@app.post("/recommendations")
async def get_recommendations(user_data: dict):
    """Basic personalized recommendation stub.
    In full version: use FashionCLIP embeddings + body/skin + trend signals.
    """
    body = user_data.get("body_type", "Average")
    skin = user_data.get("skin_tone_category", "Neutral")
    
    recs = [
        {"id": 101, "name": "Oversized Linen Shirt", "reason": f"Flattering for {body} with {skin} undertones", "score": 0.92},
        {"id": 102, "name": "High-waist Wide Leg Pants", "reason": "Balances proportions and works with current seasonal trends", "score": 0.87},
        {"id": 103, "name": "Soft Structured Blazer", "reason": "Adds structure; recommended for your body shape", "score": 0.81},
    ]
    return {"success": True, "recommendations": recs, "explanation": "Generated using body shape + skin tone + preference matching (demo)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
