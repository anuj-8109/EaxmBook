import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  location: {
    type: String,
    default: null,
  },
  salary: {
    type: String,
    default: null,
  },
  job_type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
    default: 'Full-time',
  },
  category: {
    type: String,
    default: null, // e.g., 'Government', 'Private', 'Banking', 'SSC', 'UPSC'
  },
  exam_name: {
    type: String,
    default: null, // e.g., 'SSC CGL', 'Bank PO', 'Railway NTPC'
  },
  application_deadline: {
    type: Date,
    default: null,
  },
  application_link: {
    type: String,
    default: null,
  },
  source: {
    type: String,
    enum: ['manual', 'api'],
    default: 'manual',
  },
  source_api: {
    type: String,
    default: null, // API name if from 3rd party
  },
  external_id: {
    type: String,
    default: null, // ID from 3rd party API
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  is_featured: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
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

jobSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Job', jobSchema);

