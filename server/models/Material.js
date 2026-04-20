import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  material_type: {
    type: String,
    enum: ['pdf', 'video', 'note', 'formula', 'theory'],
    required: true,
  },
  file_url: {
    type: String,
    default: null, // URL to PDF, video, etc.
  },
  file_size: {
    type: Number,
    default: null, // Size in bytes
  },
  duration: {
    type: Number,
    default: null, // For videos, in seconds
  },
  thumbnail_url: {
    type: String,
    default: null,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null,
  },
  topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    default: null,
  },
  level_number: {
    type: Number,
    default: null, // For Basic to Advance levels
  },
  is_paid: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    default: 0,
  },
  download_count: {
    type: Number,
    default: 0,
  },
  view_count: {
    type: Number,
    default: 0,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
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

materialSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Material', materialSchema);

