// Simple API client for the WardrobeAI system
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'

export const api = {
  async analyzeUser(imageBase64) {
    const res = await fetch(`${BACKEND}/api/ai/analyze-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64 }),
    })
    return res.json()
  },

  async generateTryOn(userImageBase64, garmentId) {
    const res = await fetch(`${BACKEND}/api/ai/try-on`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_image_base64: userImageBase64, garment_id: garmentId }),
    })
    return res.json()
  },

  async getRecommendations(userAnalysis) {
    const res = await fetch(`${BACKEND}/api/ai/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAnalysis),
    })
    return res.json()
  },
}

export default api
