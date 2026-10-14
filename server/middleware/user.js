import jwt from 'jsonwebtoken';
import user from '../models/userModel.js';

export const Auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.split(' ').pop();
    const verified = jwt.verify(token, process.env.SECRET);
    const rootUser = await user.findOne({ _id: verified.id });
    if (!rootUser) throw new Error('user not found');
    req.token = token;
    req.rootUser = rootUser;
    req.rootUserId = rootUser._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid Token' });
  }
};
