import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '15mb' })); // Support base64 images

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'WardrobeAI Backend',
    timestamp: new Date().toISOString() 
  });
});

// Mount AI gateway routes (proxies to FastAPI service)
app.use('/api/ai', aiRoutes);

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
});
