// Manages delivery real-time channels and nearby courier broadcasting.
const jwt = require('jsonwebtoken');

const courierPresence = new Map();
let ioRef = null;

function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function normalizeLocation(location) {
  if (!location || typeof location !== 'object') return null;
  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') return null;
  return { lat: location.lat, lng: location.lng };
}

function getNearbyCourierIds(pickupLocation) {
  const maxDistanceKm = Number(process.env.DELIVERY_BROADCAST_RADIUS_KM || 15);
  const target = normalizeLocation(pickupLocation);

  return Array.from(courierPresence.entries())
    .filter(([, presence]) => presence.available)
    .filter(([, presence]) => {
      if (!target || !presence.location) {
        return true;
      }

      return haversineDistanceKm(target, presence.location) <= maxDistanceKm;
    })
    .map(([courierUserId]) => Number(courierUserId));
}

function emitToUsers(userIds, eventName, payload) {
  if (!ioRef) return;

  userIds.forEach((userId) => {
    ioRef.to(`user:${userId}`).emit(eventName, payload);
  });
}

function emitDeliveryRequestCreated(deliveryRequest) {
  if (!ioRef) return [];

  const nearbyCourierIds = getNearbyCourierIds(deliveryRequest.pickup_location);
  emitToUsers(nearbyCourierIds, 'delivery:request:new', deliveryRequest);

  return nearbyCourierIds;
}

function emitDeliveryOfferUpdate(requestUserId, payload) {
  emitToUsers([requestUserId], 'delivery:offer:update', payload);
}

function emitDeliveryRequestUpdate(userIds, payload) {
  emitToUsers(userIds, 'delivery:request:update', payload);
}

function initDeliveryRealtime(httpServer) {
  const { Server } = require('socket.io');

  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');

  ioRef = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: false
    }
  });

  ioRef.use((socket, next) => {
    const bearerToken = socket.handshake.auth?.token || socket.handshake.query?.token;
    const token = typeof bearerToken === 'string' ? bearerToken.replace(/^Bearer\s+/i, '') : null;

    if (!token) {
      return next(new Error('Unauthorized: token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (error) {
      return next(new Error('Unauthorized: token invalid'));
    }
  });

  ioRef.on('connection', (socket) => {
    const userId = Number(socket.user.id);
    const role = socket.user.role;

    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    if (role === 'courier') {
      const previous = courierPresence.get(userId) || {};
      courierPresence.set(userId, {
        socketId: socket.id,
        location: previous.location || null,
        available: previous.available !== undefined ? previous.available : true
      });
    }

    socket.on('delivery:courier:location', (payload) => {
      if (role !== 'courier') return;

      const location = normalizeLocation(payload);
      if (!location) return;

      const current = courierPresence.get(userId) || { available: true };
      courierPresence.set(userId, {
        ...current,
        location,
        socketId: socket.id
      });
    });

    socket.on('delivery:courier:availability', (payload) => {
      if (role !== 'courier') return;

      const available = payload && typeof payload.available === 'boolean' ? payload.available : true;
      const current = courierPresence.get(userId) || { location: null };

      courierPresence.set(userId, {
        ...current,
        available,
        socketId: socket.id
      });
    });

    socket.on('disconnect', () => {
      if (role !== 'courier') return;

      const current = courierPresence.get(userId);
      if (!current) return;
      if (current.socketId !== socket.id) return;

      courierPresence.delete(userId);
    });
  });

  return ioRef;
}

module.exports = {
  initDeliveryRealtime,
  emitDeliveryRequestCreated,
  emitDeliveryOfferUpdate,
  emitDeliveryRequestUpdate
};