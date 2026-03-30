import api from './api';

export const chatService = {
    // Send message to chatbot
    sendMessage: (message) => {
        return api.post('/chatbot/message', { message });
    },
};
