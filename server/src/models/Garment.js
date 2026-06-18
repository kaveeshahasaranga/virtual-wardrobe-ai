import mongoose from 'mongoose';

const GarmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  color: { type: String, required: true },
  image: { type: String, required: true }, // data URL (base64) or external URL
}, { timestamps: true });

export default mongoose.model('Garment', GarmentSchema);
