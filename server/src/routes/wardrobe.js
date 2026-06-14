import express from 'express';
import Analysis from '../models/Analysis.js';
import Outfit from '../models/Outfit.js';

const router = express.Router();

// Save a new analysis result (called after successful /api/ai/analyze-user)
router.post('/analysis', async (req, res) => {
  try {
    const { userId, bodyType, skinTone, skinToneCategory, landmarksSample } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const analysis = await Analysis.create({
      userId,
      bodyType,
      skinTone,
      skinToneCategory,
      landmarksSample: landmarksSample || [],
    });

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('Save analysis error:', err);
    res.status(500).json({ success: false, message: 'Failed to save analysis' });
  }
});

// Get latest analysis for a user
router.get('/analysis/:userId/latest', async (req, res) => {
  try {
    const { userId } = req.params;
    const latest = await Analysis.findOne({ userId }).sort({ createdAt: -1 });

    if (!latest) {
      return res.json({ success: true, analysis: null });
    }

    res.json({ success: true, analysis: latest });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch analysis' });
  }
});

// Save a generated outfit / look
router.post('/outfits', async (req, res) => {
  try {
    const { userId, name, items, generatedLooks } = req.body;

    if (!userId || !items?.length) {
      return res.status(400).json({ success: false, message: 'userId and items are required' });
    }

    const outfit = await Outfit.create({
      userId,
      name: name || 'My Look',
      items,
      generatedLooks: generatedLooks || [],
    });

    res.json({ success: true, outfit });
  } catch (err) {
    console.error('Save outfit error:', err);
    res.status(500).json({ success: false, message: 'Failed to save outfit' });
  }
});

// List saved outfits for a user (most recent first)
router.get('/outfits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const outfits = await Outfit.find({ userId }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, outfits });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch outfits' });
  }
});

// Basic health for persistence
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    persistence: 'mongo',
    status: 'ok' 
  });
});

export default router;
