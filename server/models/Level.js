import mongoose from 'mongoose';

const levelSchema = new mongoose.Schema({
  level_number: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  name: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  total_questions: {
    type: Number,
    default: 1000, // 1000 practice questions per level
  },
  skip_test_questions: {
    type: Number,
    default: 30, // 30 questions for skip test
  },
  skip_test_pass_percentage: {
    type: Number,
    default: 80, // 80% required to pass skip test
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

// Unique constraint: one level per topic
levelSchema.index({ topic_id: 1, level_number: 1 }, { unique: true });

levelSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Level', levelSchema);

