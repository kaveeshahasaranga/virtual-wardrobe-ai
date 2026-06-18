// Simple API client for the WardrobeAI system
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'

// Demo user id (persisted in localStorage so the same "user" gets their data across refreshes)
export function getDemoUserId() {
  let id = localStorage.getItem('demoUserId')
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2)
    localStorage.setItem('demoUserId', id)
  }
  return id
}

export const api = {
  async analyzeUser(imageBase64) {
    const res = await fetch(`${BACKEND}/api/ai/analyze-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64 }),
    })
    return res.json()
  },

  async generateTryOn(userImageBase64, garment) {
    // garment can be {id, image, ...} or just id (backward compat)
    const garmentId = typeof garment === 'object' ? garment.id : garment;
    const garmentImage = typeof garment === 'object' ? garment.image : null;

    const body = { user_image_base64: userImageBase64, garment_id: garmentId };
    if (garmentImage) {
      if (garmentImage.startsWith('data:')) {
        body.garment_image_base64 = garmentImage;
      } else {
        body.garment_url = garmentImage;
      }
    }

    const res = await fetch(`${BACKEND}/api/ai/try-on`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },

  async getGarments() {
    const res = await fetch(`${BACKEND}/api/wardrobe/garments`);
    return res.json();
  },

  async createGarment(garment) {
    const res = await fetch(`${BACKEND}/api/wardrobe/garments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(garment),
    });
    return res.json();
  },

  async deleteGarment(id) {
    const res = await fetch(`${BACKEND}/api/wardrobe/garments/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getRecommendations(userAnalysis) {
    const res = await fetch(`${BACKEND}/api/ai/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAnalysis),
    })
    return res.json()
  },

  // === Persistence (new) ===
  async saveAnalysis(analysisData) {
    const userId = getDemoUserId()
    const res = await fetch(`${BACKEND}/api/wardrobe/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        bodyType: analysisData.body_type,
        skinTone: analysisData.skin_tone,
        skinToneCategory: analysisData.skin_tone_category,
        landmarksSample: analysisData.landmarks_sample,
      }),
    })
    return res.json()
  },

  async getLatestAnalysis() {
    const userId = getDemoUserId()
    const res = await fetch(`${BACKEND}/api/wardrobe/analysis/${userId}/latest`)
    return res.json()
  },

  async saveOutfit({ name, items, generatedLooks }) {
    const userId = getDemoUserId()
    const res = await fetch(`${BACKEND}/api/wardrobe/outfits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name, items, generatedLooks }),
    })
    return res.json()
  },

  async getSavedOutfits() {
    const userId = getDemoUserId()
    const res = await fetch(`${BACKEND}/api/wardrobe/outfits/${userId}`)
    return res.json()
  },
}

export default api
