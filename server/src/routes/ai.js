import express from 'express';
import axios from 'axios';

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    const { data } = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 3000 });
    res.json(data);
  } catch (e) {
    res.status(503).json({ status: 'ai-service-down', error: e.message });
  }
});

// Analyze user (pose + body shape + skin tone)
// Client sends { image_base64: "data:image/..." }
router.post('/analyze-user', async (req, res) => {
  try {
    const { image_base64 } = req.body;
    if (!image_base64) return res.status(400).json({ success: false, message: 'image_base64 required' });

    // Convert base64 to buffer and send as multipart to AI service
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', buffer, { filename: 'user.jpg', contentType: 'image/jpeg' });

    const { data } = await axios.post(`${AI_SERVICE_URL}/analyze-user`, form, {
      headers: form.getHeaders(),
      timeout: 15000
    });

    res.json(data);
  } catch (err) {
    console.error('AI analyze error:', err.message);
    res.status(502).json({ success: false, message: 'Failed to analyze via AI service' });
  }
});

// Virtual try-on
router.post('/try-on', async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_SERVICE_URL}/try-on`, req.body, { timeout: 20000 });
    res.json(data);
  } catch (err) {
    res.status(502).json({ success: false, message: 'AI service unavailable for try-on' });
  }
});

// Personalized recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_SERVICE_URL}/recommendations`, req.body);
    res.json(data);
  } catch (err) {
    res.status(502).json({ success: false, message: 'Recommendation service unavailable' });
  }
});

export default router;
