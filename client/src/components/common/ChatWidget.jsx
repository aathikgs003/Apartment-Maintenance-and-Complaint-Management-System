import { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { AuthContext } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';

export default function ChatWidget() {
    const { user, isAuthenticated } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0 && user) {
            setMessages([
                {
                    id: 1,
                    text: `Hi ${user.name.split(' ')[0]}! I'm your maintenance assistant. How can I help you today?`,
                    isUser: false,
                    suggestions: [
                        'How to raise a complaint?',
                        'Check my complaint status',
                        'Where can I find FAQs?',
                        'Go to my profile'
                    ],
                    timestamp: new Date(),
                },
            ]);
        }
    }, [isOpen, user, messages.length]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (text) => {
        const messageText = text || inputValue;
        if (!messageText.trim()) return;

        // Add user message
        const newMessage = {
            id: Date.now(),
            text: messageText,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await chatService.sendMessage(messageText);

            const botResponse = {
                id: Date.now() + 1,
                text: response.data.reply,
                suggestions: response.data.suggestions,
                link: response.data.link,
                linkText: response.data.linkText,
                isUser: false,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botResponse]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    text: "Sorry, I'm having trouble connecting to the server. Please check your internet connection and try again.",
                    isUser: false,
                    timestamp: new Date(),
                    isError: true,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-sky-500 text-white shadow-lg shadow-sky-200 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-shadow"
                aria-label="Toggle Chat"
            >
                {isOpen ? <XMarkIcon className="w-8 h-8" /> : <ChatBubbleLeftRightIcon className="w-8 h-8" />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="fixed bottom-24 right-6 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden border border-sky-100 dark:border-gray-700 flex flex-col max-h-[600px] sm:max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="bg-sky-500 p-5 text-white flex justify-between items-center shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg tracking-tight">AI Assistant</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">Always Online</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900 h-96 scrollbar-hide">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold leading-relaxed ${msg.isUser
                                            ? 'bg-sky-100 text-sky-900 rounded-br-none shadow-sm border border-sky-200'
                                            : 'bg-white text-slate-900 rounded-bl-none shadow-md border border-sky-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                        
                                        {msg.link && (
                                            <a
                                                href={msg.link}
                                                target={msg.link.startsWith('http') ? '_blank' : '_self'}
                                                rel="noopener noreferrer"
                                                className="mt-4 block w-full text-center py-2.5 px-4 bg-white hover:bg-sky-50 text-sky-600 font-black rounded-xl transition-all border-2 border-sky-100 text-xs shadow-sm"
                                            >
                                                {msg.linkText || 'View Details'}
                                            </a>
                                        )}

                                        <span className={`text-[10px] block mt-2 font-black uppercase tracking-widest ${msg.isUser ? 'text-sky-500' : 'text-slate-400'}`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-sky-50 dark:bg-gray-700 p-4 rounded-2xl rounded-bl-none shadow-sm border border-sky-100 dark:border-gray-600">
                                        <div className="flex space-x-2">
                                            <div className="w-2 h-2 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestions */}
                        {messages.length > 0 && !messages[messages.length - 1].isUser && messages[messages.length - 1].suggestions && messages[messages.length - 1].suggestions.length > 0 && (
                            <div className="px-4 py-3 bg-white dark:bg-gray-900 flex gap-2 flex-wrap border-t border-slate-50 dark:border-gray-800">
                                {messages[messages.length - 1].suggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSendMessage(suggestion)}
                                        className="text-xs font-black bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 px-4 py-2 rounded-xl hover:bg-sky-500 hover:text-white transition-all border-2 border-sky-100 dark:border-sky-800 shadow-sm"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="flex items-center gap-3"
                            >
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-3 rounded-xl border-2 border-sky-50 dark:border-gray-600 bg-sky-50/30 dark:bg-gray-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm font-bold transition-all placeholder:text-slate-400"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isLoading}
                                    className="p-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 shadow-lg shadow-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    <PaperAirplaneIcon className="w-6 h-6" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
