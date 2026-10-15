import { Server } from 'socket.io';

let io;
const activeUsers = new Map();

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                const configured = process.env.ALLOWED_ORIGINS
                    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
                    : [];
                const defaults = [
                    process.env.FRONTEND_URL,
                    'http://localhost:5173',
                    'http://localhost:3000',
                    'https://aptcare-frontend.vercel.app',
                ].filter(Boolean);
                const allowed = [...new Set([...configured, ...defaults])];

                let isAllowed = allowed.includes(origin) || process.env.NODE_ENV === 'development';
                if (!isAllowed) {
                    try {
                        const parsed = new URL(origin);
                        if (parsed.hostname.endsWith('.vercel.app')) isAllowed = true;
                    } catch (e) {}
                }

                if (isAllowed) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by Socket CORS'));
                }
            },
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
