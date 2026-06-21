import express from 'express';
import Analysis from '../models/Analysis.js';
import Outfit from '../models/Outfit.js';
import Garment from '../models/Garment.js';

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

// === Garment Catalog ===
router.get('/garments', async (req, res) => {
  try {
    const garments = await Garment.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      garments: garments.map(g => ({
        id: g._id.toString(),
        name: g.name,
        category: g.category,
        color: g.color,
        image: g.image,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch garments' });
  }
});

router.post('/garments', async (req, res) => {
  try {
    const { name, category, color, image } = req.body;
    if (!name || !category || !color || !image) {
      return res.status(400).json({ success: false, message: 'name, category, color, and image are required' });
    }
    const garment = await Garment.create({ name, category, color, image });
    res.json({
      success: true,
      garment: {
        id: garment._id.toString(),
        name: garment.name,
        category: garment.category,
        color: garment.color,
        image: garment.image,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create garment' });
  }
});

router.delete('/garments/:id', async (req, res) => {
  try {
    await Garment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete garment' });
  }
});

// Recommendations using the live garment catalog + body/skin scoring
// (moved/enhanced from AI service for real data access)
router.post('/recommendations', async (req, res) => {
  try {
    const { body_type = "Rectangle / Balanced", skin_tone_category = "Neutral" } = req.body;

    const rawGarments = await Garment.find().lean();

    if (!rawGarments.length) {
      return res.json({ success: true, recommendations: [], explanation: "No garments in catalog yet." });
    }

    let catalog = rawGarments.map(item => ({
      id: item._id.toString(),
      name: item.name,
      category: item.category,
      color: item.color,
      image: item.image,
      reason_base: `Versatile ${item.category.toLowerCase()} that works for many looks`,
    }));

    const scored = [];
    for (const item of catalog) {
      let score = 0.75;

      // Body shape logic (ported + adapted)
      if (body_type.includes("Rectangle") || body_type.includes("Balanced")) {
        if (item.name.toLowerCase().includes("wide") || item.name.toLowerCase().includes("oversized") || item.name.toLowerCase().includes("structured")) {
          score += 0.12;
        }
      }
      if (body_type.includes("Inverted")) {
        if (item.name.toLowerCase().includes("high-waist") || item.name.toLowerCase().includes("tapered")) {
          score += 0.10;
        }
      }
      if (body_type.includes("Pear") || body_type.includes("Hourglass")) {
        if (item.name.toLowerCase().includes("oversized") || item.name.toLowerCase().includes("wide")) {
          score += 0.08;
        }
      }

      // Skin tone logic
      if (skin_tone_category === "Warm") {
        if (["Beige", "Olive", "Cream", "Khaki", "White"].includes(item.color)) score += 0.10;
      } else if (skin_tone_category === "Cool") {
        if (["Light Blue", "White", "Black", "Cream"].includes(item.color)) score += 0.10;
      } else {
        score += 0.05;
      }

      const reason = `${item.reason_base}. Complements your ${body_type.split('/')[0].trim().toLowerCase()} shape and ${skin_tone_category.toLowerCase()} undertones.`;

      scored.push({
        ...item,
        score: Math.min(Math.round(score * 100) / 100, 0.98),
        reason,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    const topRecs = scored.slice(0, 5);

    res.json({
      success: true,
      recommendations: topRecs,
      explanation: `Recommendations generated using your ${body_type} body shape and ${skin_tone_category} skin undertones from the live catalog.`,
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
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
