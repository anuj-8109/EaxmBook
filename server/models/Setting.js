import mongoose from 'mongoose';

const smtpSchema = new mongoose.Schema(
  {
    host: String,
    port: Number,
    secure: Boolean,
    user: String,
    password: String,
    fromName: String,
    fromEmail: String,
  },
  { _id: false },
);

const googleSchema = new mongoose.Schema(
  {
    clientId: String,
    clientSecret: String,
  },
  { _id: false },
);

const groqSchema = new mongoose.Schema(
  {
    apiKey: String,
    modelName: { type: String, default: 'llama-3.3-70b-versatile' },
  },
  { _id: false },
);

const settingSchema = new mongoose.Schema(
  {
    smtp: smtpSchema,
    google: googleSchema,
    groq: groqSchema,
    system: {
      app_name: { type: String, default: 'Easy Exam Gen' },
      logo: { type: String, default: null }, // base64 image
      favicon: { type: String, default: null }, // base64 image
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { minimize: false },
);

settingSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model('Setting', settingSchema);


