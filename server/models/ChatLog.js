import mongoose from 'mongoose';

const chatLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['resident', 'staff', 'admin'],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        aiResponse: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        collection: 'chatLogs',
    }
);

export default mongoose.model('ChatLog', chatLogSchema);
