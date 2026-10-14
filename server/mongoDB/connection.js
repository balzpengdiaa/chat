import mongoose from 'mongoose';
mongoose.set('strictQuery', false);

// Cache koneksi supaya tidak membuat koneksi baru di tiap invocation (serverless/Vercel)
let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

const mongoDBConnect = async () => {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.URL, { bufferCommands: false })
      .then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
  return cached.conn;
};
export default mongoDBConnect;
