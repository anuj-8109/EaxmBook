import mongoose from 'mongoose';

const levelContentSchema = new mongoose.Schema({
  level_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true,
  },
  content_type: {
    type: String,
    enum: ['pdf', 'note', 'formula', 'video', 'theory', 'written'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  // For PDFs and videos
  file_url: {
    type: String,
    default: null,
  },
  // For written content, notes, theory
  content_text: {
    type: String,
    default: null,
  },
  // For formulas
  formula_text: {
    type: String,
    default: null,
  },
  // Video duration in seconds
  video_duration: {
    type: Number,
    default: null,
  },
  // Order for display
  display_order: {
    type: Number,
    default: 0,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

levelContentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('LevelContent', levelContentSchema);

