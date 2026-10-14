import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    bio: { type: String, default: 'Available' },
    profilePic: {
      type: String,
      default:
        'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);
userSchema.methods.generateAuthToken = async function () {
  return jwt.sign({ id: this._id, phone: this.phone }, process.env.SECRET, {
    expiresIn: '30d',
  });
};
const userModel = mongoose.models.User || mongoose.model('User', userSchema);
export default userModel;
