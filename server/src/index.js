import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai.js';
import wardrobeRoutes from './routes/wardrobe.js';
import { connectDB, getConnectionStatus } from './db.js';
import Garment from './models/Garment.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '15mb' })); // Support base64 images

// Connect to MongoDB (non-blocking — app still works without it)
connectDB();

// Seed initial garments for the catalog (prototype only)
seedDefaultGarments();

async function seedDefaultGarments() {
  try {
    const count = await Garment.countDocuments();
    if (count === 0) {
      const defaults = [
        { name: "Oversized White Tee", category: "Top", color: "White", image: "https://images.unsplash.com/photo-1618519764620-7403ba5c9c52?w=512" },
        { name: "Black Denim Jacket", category: "Outerwear", color: "Black", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=512" },
        { name: "Beige Linen Shirt", category: "Top", color: "Beige", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=512" },
        { name: "Relaxed Chino Pants", category: "Bottom", color: "Khaki", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=512" },
      ];
      await Garment.insertMany(defaults);
      console.log('✅ Seeded default garments into MongoDB');
    }
  } catch (e) {
    console.log('Garment seeding skipped:', e.message);
  }
}

app.get('/api/health', (req, res) => {
  const dbStatus = getConnectionStatus();
  res.json({ 
    status: 'ok', 
    service: 'WardrobeAI Backend',
    timestamp: new Date().toISOString(),
    persistence: dbStatus.connected ? 'mongo-connected' : 'mongo-not-connected'
  });
});

// Mount AI gateway routes (proxies to FastAPI service)
app.use('/api/ai', aiRoutes);

// New persistence routes (analyses, saved outfits)
app.use('/api/wardrobe', wardrobeRoutes);

// Legacy/simple try-on (can be removed later)
app.post('/api/try-on', async (req, res) => {
  const { userImage, garmentId } = req.body;
  res.json({
    success: true,
    message: 'Try-on request received (gateway recommended)',
    resultUrl: 'https://picsum.photos/id/1012/600/800',
    garmentId
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   AI gateway mounted at /api/ai`);
  console.log(`   Wardrobe persistence + garments mounted at /api/wardrobe`);
});
