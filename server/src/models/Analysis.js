import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  bodyType: { type: String },
  skinTone: { type: String },
  skinToneCategory: { type: String },
  landmarksSample: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

AnalysisSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Analysis', AnalysisSchema);
