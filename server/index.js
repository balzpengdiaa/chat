// Untuk menjalankan lokal: npm start. Di Vercel dipakai api/index.js.
import app from './app.js';
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server Listening at PORT - ${PORT}`));
