import mongoose from 'mongoose';

const levelProgressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  level_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
  },
  level_number: {
    type: Number,
    required: true,
  },
  // Status: locked, unlocked, in_progress, completed, skipped
  status: {
    type: String,
    enum: ['locked', 'unlocked', 'in_progress', 'completed', 'skipped'],
    default: 'locked',
  },
  // Practice progress
  practice_questions_attempted: {
    type: Number,
    default: 0,
  },
  practice_questions_correct: {
    type: Number,
    default: 0,
  },
  practice_questions_wrong: {
    type: Number,
    default: 0,
  },
  practice_accuracy: {
    type: Number,
    default: 0,
  },
  // Skip test status
  skip_test_passed: {
    type: Boolean,
    default: false,
  },
  skip_test_attempts: {
    type: Number,
    default: 0,
  },
  skip_test_best_score: {
    type: Number,
    default: 0,
  },
  // Timestamps
  unlocked_at: {
    type: Date,
    default: null,
  },
  completed_at: {
    type: Date,
    default: null,
  },
  skipped_at: {
    type: Date,
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

// Unique constraint: one progress per user per level
levelProgressSchema.index({ user_id: 1, level_id: 1 }, { unique: true });

levelProgressSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('LevelProgress', levelProgressSchema);

