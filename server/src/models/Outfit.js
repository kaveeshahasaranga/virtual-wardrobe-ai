import mongoose from 'mongoose';

const OutfitItemSchema = new mongoose.Schema({
  id: Number,
  name: String,
  category: String,
  color: String,
  reason: String,
}, { _id: false });

const SavedOutfitSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, default: 'My Look' },
  items: [OutfitItemSchema],
  // Store result images as base64 data URIs (for prototype simplicity)
  // In production we would store references to object storage
  generatedLooks: [{
    itemId: Number,
    itemName: String,
    image: String,   // base64 data URL or external URL
  }],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

SavedOutfitSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Outfit', SavedOutfitSchema);
