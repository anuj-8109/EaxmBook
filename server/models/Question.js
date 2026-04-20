import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  // Multi-language question text
  question_text: {
    type: String,
    required: true,
  },
  question_text_hindi: {
    type: String,
    default: null,
  },
  // Five options (a, b, c, d, x) - x is hidden from students
  option_a: {
    type: String,
    required: true,
  },
  option_a_hindi: {
    type: String,
    default: null,
  },
  option_b: {
    type: String,
    required: true,
  },
  option_b_hindi: {
    type: String,
    default: null,
  },
  option_c: {
    type: String,
    required: true,
  },
  option_c_hindi: {
    type: String,
    default: null,
  },
  option_d: {
    type: String,
    required: true,
  },
  option_d_hindi: {
    type: String,
    default: null,
  },
  option_x: {
    type: String,
    default: null, // Hidden from students
  },
  option_x_hindi: {
    type: String,
    default: null,
  },
  correct_answer: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4], // 0=A, 1=B, 2=C, 3=D, 4=X
  },
  hint: {
    type: String,
    default: null,
  },
  hint_hindi: {
    type: String,
    default: null,
  },
  explanation: {
    type: String,
    default: null,
  },
  explanation_hindi: {
    type: String,
    default: null,
  },
  // Media support - images and videos
  question_image_url: {
    type: String,
    default: null,
  },
  question_video_url: {
    type: String,
    default: null,
  },
  option_a_image_url: {
    type: String,
    default: null,
  },
  option_b_image_url: {
    type: String,
    default: null,
  },
  option_c_image_url: {
    type: String,
    default: null,
  },
  option_d_image_url: {
    type: String,
    default: null,
  },
  option_x_image_url: {
    type: String,
    default: null,
  },
  hint_image_url: {
    type: String,
    default: null,
  },
  explanation_image_url: {
    type: String,
    default: null,
  },
  // Multi-select fields
  exam_names: [{
    type: String,
  }],
  category_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  subject_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  }],
  topic_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
  }],
  // Single select (for backward compatibility)
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
  // Enhanced fields
  difficulty_level: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5,
  },
  time_duration: {
    type: Number, // in seconds
    default: null,
  },
  question_reference: {
    type: String,
    default: null,
  },
  // Legacy difficulty field (for backward compatibility)
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  image_url: {
    type: String,
    default: null,
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

questionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Question', questionSchema);

