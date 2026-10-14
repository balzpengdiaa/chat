import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoDBConnect from './mongoDB/connection.js';
import userRoutes from './routes/user.js';
import chatRoutes from './routes/chat.js';
import messageRoutes from './routes/message.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.BASE_URL ? process.env.BASE_URL.split(',') : true,
  })
);

app.get('/', (req, res) => res.json({ status: 'ok' }));

// Pastikan DB tersambung sebelum route apa pun (aman untuk serverless)
app.use(async (req, res, next) => {
  try {
    await mongoDBConnect();
    next();
  } catch (error) {
    console.log('MongoDB error ' + error);
    res.status(500).json({ error: 'Database tidak tersambung' });
  }
});

app.use('/', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

export default app;
