import { Server } from 'socket.io';

let io;
const activeUsers = new Map();

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS
                ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
                : [process.env.FRONTEND_URL || 'http://localhost:5173'],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('register', (userId) => {
            if (userId) {
                activeUsers.set(userId, socket.id);
                socket.userId = userId;
                console.log(`User ${userId} registered to socket ${socket.id}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            if (socket.userId) {
                activeUsers.delete(socket.userId);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export const getSocketIdByUserId = (userId) => {
    return activeUsers.get(userId.toString());
};
