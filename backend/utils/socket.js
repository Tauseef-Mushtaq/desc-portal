const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Why Redis here at all:
 * The backend runs as 2-5 replicas behind a ClusterIP Service (see k8s/hpa.yaml).
 * A citizen's browser holds one Socket.io connection to exactly one pod. If an
 * admin's status-update request lands on a *different* pod, that pod has no
 * direct way to reach the citizen's socket — Socket.io's in-memory room registry
 * is per-process. The Redis adapter solves this by giving every pod a shared
 * pub/sub channel: emitting to a room on any pod broadcasts to the matching
 * sockets on every pod. Without it, real-time notifications would only work
 * by coincidence (when sender and recipient land on the same pod).
 */
async function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const { createClient } = require('redis');
      const { createAdapter } = require('@socket.io/redis-adapter');
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.IO Redis adapter connected:', redisUrl);
    } catch (err) {
      console.error('⚠️  Redis adapter failed to connect, notifications will only reach this pod:', err.message);
    }
  } else {
    console.warn('⚠️  REDIS_URL not set — running single-instance Socket.IO (fine for local dev, not for multi-replica).');
  }

  // Auth handshake: client connects with { auth: { token } } using the same JWT as the REST API.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    // Every user (citizen or admin) gets a private room keyed by their own id.
    // Notifying "all admins" just means looking up admin user ids and emitting
    // to each of their rooms — see utils/notify.js.
    socket.join(`user:${socket.userId}`);
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet — call initSocket(server) first');
  }
  return io;
}

module.exports = { initSocket, getIO };
