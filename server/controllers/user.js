import crypto from 'crypto';
import user from '../models/userModel.js';
import Otp from '../models/otpModel.js';
import { normalizePhone } from '../utils/phone.js';
import { sendWhatsApp } from '../utils/fonnte.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const hash = (phone, code) =>
  crypto
    .createHash('sha256')
    .update(`${phone}:${code}:${process.env.SECRET}`)
    .digest('hex');

// POST /auth/otp/send  { phone, purpose: 'login' | 'register' }
export const sendOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const { purpose } = req.body;
    if (!phone) return res.status(400).json({ error: 'Nomor HP tidak valid' });

    const exists = await user.exists({ phone });
    if (purpose === 'register' && exists)
      return res
        .status(400)
        .json({ error: 'Nomor sudah terdaftar, silakan login' });
    if (purpose === 'login' && !exists)
      return res
        .status(404)
        .json({ error: 'Nomor belum terdaftar, silakan daftar' });

    const old = await Otp.findOne({ phone });
    if (old && Date.now() - old.sentAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - old.sentAt.getTime())) / 1000
      );
      return res
        .status(429)
        .json({ error: `Tunggu ${wait} detik sebelum kirim ulang OTP` });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    await Otp.findOneAndUpdate(
      { phone },
      {
        codeHash: hash(phone, code),
        attempts: 0,
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
      { upsert: true, new: true }
    );
    await sendWhatsApp(
      phone,
      `Kode OTP Anda: *${code}*\nBerlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.`
    );
    res.status(200).json({ message: 'OTP terkirim', phone });
  } catch (error) {
    console.log('Error sendOtp ' + error);
    res.status(500).json({ error: error.message || 'Gagal mengirim OTP' });
  }
};

// POST /auth/otp/verify  { phone, code, name? }
// Nomor sudah terdaftar -> login. Belum terdaftar dan ada `name` -> daftar.
export const verifyOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const code = String(req.body.code || '').trim();
    const name = String(req.body.name || '').trim();
    if (!phone || !code)
      return res.status(400).json({ error: 'Nomor dan kode OTP wajib diisi' });

    const otp = await Otp.findOne({ phone });
    if (!otp || otp.expiresAt < new Date())
      return res
        .status(400)
        .json({ error: 'OTP kedaluwarsa, silakan minta kode baru' });
    if (otp.attempts >= MAX_ATTEMPTS) {
      await Otp.deleteOne({ phone });
      return res
        .status(429)
        .json({ error: 'Terlalu banyak percobaan, minta kode baru' });
    }
    if (otp.codeHash !== hash(phone, code)) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ error: 'Kode OTP salah' });
    }

    let account = await user.findOne({ phone });
    if (!account) {
      if (!name)
        return res
          .status(404)
          .json({ error: 'Nomor belum terdaftar, silakan daftar' });
      account = await user.create({ phone, name });
    }
    await Otp.deleteOne({ phone });
    const token = await account.generateAuthToken();
    res.status(200).json({ token, user: account });
  } catch (error) {
    console.log('Error verifyOtp ' + error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const validUser = async (req, res) => {
  try {
    const validuser = await user.findOne({ _id: req.rootUserId });
    if (!validuser) return res.status(401).json({ message: 'user is not valid' });
    res.status(201).json({ user: validuser, token: req.token });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const searchUsers = async (req, res) => {
  const q = (req.query.search || '').trim();
  let filter = {};
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const digits = q.replace(/\D/g, '');
    const or = [{ name: { $regex: escaped, $options: 'i' } }];
    if (digits.length >= 3) {
      const norm = normalizePhone(digits) || digits;
      or.push({ phone: { $regex: norm.replace(/^62/, '') } });
    }
    filter = { $or: or };
  }
  const users = await user
    .find(filter)
    .find({ _id: { $ne: req.rootUserId } })
    .limit(30);
  res.status(200).send(users);
};

export const getUserById = async (req, res) => {
  try {
    const selectedUser = await user.findOne({ _id: req.params.id });
    res.status(200).json(selectedUser);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const updateInfo = async (req, res) => {
  try {
    const { id } = req.params;
    if (String(id) !== String(req.rootUserId))
      return res.status(403).json({ error: 'Tidak diizinkan' });
    const { bio, name } = req.body;
    const updatedUser = await user.findByIdAndUpdate(
      id,
      { name, bio },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
