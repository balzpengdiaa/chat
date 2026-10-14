import mongoose from 'mongoose';
const otpSchema = mongoose.Schema({
  phone: { type: String, required: true, unique: true, index: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  sentAt: { type: Date, default: Date.now },
  // dokumen otomatis dihapus MongoDB setelah expiresAt (TTL index)
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
export default mongoose.models.Otp || mongoose.model('Otp', otpSchema);
