import mongoose from 'mongoose';

const paymentSettingsSchema = new mongoose.Schema({
  upi_id: {
    type: String,
    default: null,
  },
  upi_name: {
    type: String,
    default: null,
  },
  qr_code_url: {
    type: String,
    default: null,
  },
  qr_code_image: {
    type: String, // Base64 encoded image
    default: null,
  },
  bank_account_number: {
    type: String,
    default: null,
  },
  bank_ifsc: {
    type: String,
    default: null,
  },
  bank_name: {
    type: String,
    default: null,
  },
  account_holder_name: {
    type: String,
    default: null,
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

paymentSettingsSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('PaymentSettings', paymentSettingsSchema);

