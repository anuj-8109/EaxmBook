import mongoose from 'mongoose';

const testSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
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
  duration_minutes: {
    type: Number,
    required: true,
  },
  total_marks: {
    type: Number,
    required: true,
  },
  negative_marking: {
    type: Boolean,
    default: false,
  },
  negative_marks_per_question: {
    type: Number,
    default: 0.25, // Can be 0.33, 0.25, 0.5, 0.29, etc.
  },
  test_type: {
    type: String,
    enum: ['static', 'dynamic'],
    default: 'static',
  },
  difficulty_distribution: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // Enhanced fields
  is_paid: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    default: 0,
  },
  exam_name: {
    type: String,
    default: null,
  },
  subject_wise_distribution: [{
    subject_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    question_count: {
      type: Number,
      default: 0,
    },
  }],
  show_questions_subject_wise: {
    type: Boolean,
    default: false,
  },
  has_cutoff: {
    type: Boolean,
    default: false,
  },
  cutoff_by_category: [{
    category: {
      type: String,
    },
    cutoff_percentage: {
      type: Number,
    },
  }],
  total_questions: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft',
  },
  publish_at: {
    type: Date,
    default: null,
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
  is_live: {
    type: Boolean,
    default: false,
  },
  live_start_time: {
    type: Date,
    default: null,
  },
  live_end_time: {
    type: Date,
    default: null,
  },
  live_result_time: {
    type: Date,
    default: null,
  },
});

testSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Test', testSchema);

