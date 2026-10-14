import express from 'express';
import {
  sendOtp,
  verifyOtp,
  validUser,
  searchUsers,
  updateInfo,
  getUserById,
} from '../controllers/user.js';
import { Auth } from '../middleware/user.js';
const router = express.Router();
router.post('/auth/otp/send', sendOtp);
router.post('/auth/otp/verify', verifyOtp);
router.get('/auth/valid', Auth, validUser);
router.get('/api/user?', Auth, searchUsers);
router.get('/api/users/:id', Auth, getUserById);
router.patch('/api/users/update/:id', Auth, updateInfo);
export default router;
