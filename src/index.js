import { httpServer } from './app.js';
import dbConnect from './config/db.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  await dbConnect();
  httpServer.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
}

startServer();