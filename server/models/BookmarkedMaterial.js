import mongoose from 'mongoose';

const bookmarkedMaterialSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  material_type: {
    type: String,
    enum: ['pdf', 'video', 'note', 'question', 'test', 'job'],
    required: true,
  },
  material_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'material_type_ref',
  },
  material_type_ref: {
    type: String,
    enum: ['Question', 'Test', 'Job', 'Material'],
    default: null,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  file_url: {
    type: String,
    default: null, // For PDFs, videos, etc.
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
  notes: {
    type: String,
    default: null, // User's personal notes about this material
  },
  tags: [{
    type: String,
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

bookmarkedMaterialSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Index for faster queries
bookmarkedMaterialSchema.index({ user_id: 1, material_type: 1, material_id: 1 }, { unique: true });

export default mongoose.model('BookmarkedMaterial', bookmarkedMaterialSchema);

