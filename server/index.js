// server/index.js
require('dotenv').config();             // loads .env into process.env
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const minioClient = require('./config/minio');
const presignRoute = require('./routes/presign');

const app = express();

// ---- HTTP middleware & routes ----
app.use(cors());
app.use(express.json());

const bucketName = process.env.MINIO_BUCKET; // e.g. "recordings"
minioClient.bucketExists(bucketName, (err, exists) => {
  if (err) {
    console.error('Error checking bucket:', err);
  } else if (!exists) {
    minioClient.makeBucket(bucketName, '', err2 => {
      if (err2) console.error('Error creating bucket:', err2);
      else console.log(`Bucket "${bucketName}" created.`);
    });
  } else {
    console.log(`Bucket "${bucketName}" already exists.`);
  }
});

// mount the presign route at /presign
app.use('/presign', presignRoute);

// ---- start HTTP + WebSocket server on same port ----
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);

// ---- WebSocket signaling ----
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    // broadcast SDP / ICE to all other clients
    try {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    } catch (error) {
      console.error('WebSocket message handling failed:', error);
    }
  });
});

const shutdown = () => {
  wss.close();
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
