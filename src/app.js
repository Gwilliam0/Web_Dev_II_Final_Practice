import express from 'express';
import user from './routes/user.js';
import client from './routes/client.js';
import project from './routes/project.js';
import deliveryNote from './routes/deliveryNote.js';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './docs/swagger.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import morganBody from 'morgan-body';
import { loggerStream } from './utils/handleLogger.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use(morgan('dev'));
app.set('socketio', io);

io.on('connection', (socket) => {
  socket.on('join', (companyId) => {
    socket.join(companyId);
  });
});
/*
morganBody(app, {
  noColors: true,
  skip: (req, res) => res.statusCode < 400,
  stream: loggerStream
});
*/

app.use('/api/user', user);
app.use('/api/client', client);
app.use('/api/project', project);
app.use('/api/deliverynote', deliveryNote);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/upload', express.static('upload'));

export { app, httpServer };
export default app;