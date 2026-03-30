import axios from 'axios';
import ChatLog from '../models/ChatLog.js';
import Complaint from '../models/Complaint.js';
import { COMPLAINT_CATEGORIES } from '../config/constants.js';

// Hugging Face Model
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

/**
 * Handle chat messages
 * @route POST /api/chat/message
 */
export const sendMessage = async (req, res) => {
    try {
        let { message } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, message: 'Message is required and must be a string' });
        }
        message = message.trim();
        console.log('Chat Message received:', `"${message}"`);

        const userId = req.user._id;
        const role = req.user.role;

        let aiResponse = '';
        let suggestions = [];
        let link = '';
        let linkText = '';

        // --- 1. Rule-Based Logic ---

        // Check Status Logic
        const statusRegex = /(?:status|check).*(?:id|ticket)?\s*#?([A-Z0-9]+)/i;
        const statusMatch = message.match(statusRegex);

        if (statusMatch) {
            const complaintId = statusMatch[1];
            const complaint = await Complaint.findOne({ complaintId });

            if (complaint) {
                // Check if user is allowed to see this complaint
                if (role === 'resident' && complaint.residentId.toString() !== userId.toString()) {
                    aiResponse = `I found complaint #${complaintId}, but you don't have permission to view its details.`;
                } else {
                    aiResponse = `Complaint **#${complaint.complaintId}** is currently **${complaint.status}**.\n` +
                        `Category: ${complaint.category}\n` +
                        `Description: ${complaint.description}\n` +
                        (complaint.deadline ? `Deadline: ${new Date(complaint.deadline).toLocaleDateString()}` : '');
                }
            } else {
                aiResponse = `I couldn't find any complaint with ID #${complaintId}. Please check the ID and try again.`;
            }
        }
        // Raise Complaint Logic
        else if (/raise.*complaint|create.*complaint/i.test(message)) {
            aiResponse = "To raise a complaint, please go to the 'Raise Complaint' section in your dashboard. You'll need to select a category and provide a description.";
            suggestions = ['Go to Raise Complaint', 'List Categories'];
            link = role === 'resident' ? '/resident/complaints/new' : '/admin/complaints';
            linkText = 'Raise Complaint Here';
        }
        // List Categories Logic
        else if (/category|categories/i.test(message)) {
            aiResponse = `Here are the available complaint categories:\n- ${COMPLAINT_CATEGORIES.join('\n- ')}`;
            suggestions = ['Raise Complaint'];
            link = '/services';
            linkText = 'View Maintenance Services';
        }
        // Help/Guide
        else if (/help|guide|how to/i.test(message)) {
            aiResponse = "I can help you with:\n1. Checking complaint status (e.g., 'Status of #CMPL123')\n2. Listing complaint categories\n3. Guiding you to raise a complaint\n4. General maintenance questions";
            suggestions = ['Check Status', 'Complaint Categories'];
            link = '/help';
            linkText = 'Go to Help Center';
        }
        else if (/\b(faq|frequently)\b/i.test(message)) {
            aiResponse = "You can find answers to common questions in our FAQ section.";
            link = '/faq';
            linkText = 'View FAQ Page';
        }
        else if (/\b(profile|account|settings)\b/i.test(message)) {
            aiResponse = "You can manage your user profile and account settings here.";
            link = '/profile';
            linkText = 'Go to Profile';
        }
        else if (/dashboard|home/i.test(message)) {
            aiResponse = "Returning you to your dashboard overview.";
            link = role === 'resident' ? '/resident/dashboard' : (role === 'staff' ? '/staff/dashboard' : '/admin/dashboard');
            linkText = 'Go to Dashboard';
        }

        if (aiResponse) {
            console.log('Matched rule-based response:', aiResponse);
        } else {
            console.log('No rule-based match found. Falling back to AI.');
        }

        if (!aiResponse && !process.env.HUGGINGFACE_API_KEY) {
            aiResponse = "I can help you with checking complaint status, raising new maintenance requests, viewing categories, or accessing your profile. How else can I assist you?";
            suggestions = ['Check Status', 'Raise Complaint', 'View FAQ'];
        }

        // --- 2. Hugging Face API Logic (Fallback) ---

        if (!aiResponse) {
            try {
                const response = await axios.post(
                    HF_API_URL,
                    {
                        inputs: `[INST] You are a helpful assistant for an Apartment Maintenance System. 
            User: ${message}
            Assistant: [/INST]`,
                        parameters: {
                            max_new_tokens: 250,
                            return_full_text: false,
                        }
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.data && response.data[0] && response.data[0].generated_text) {
                    aiResponse = response.data[0].generated_text.trim();
                } else {
                    aiResponse = "I'm sorry, I didn't quite understand that. Could you please rephrase?";
                }

            } catch (error) {
                console.error('Hugging Face API Error:', error.response ? error.response.data : error.message);
                aiResponse = "I'm currently having trouble connecting to my AI brain. Please try asking simple questions or check back later.";
            }
        }

        // --- 3. Log Conversation ---
        await ChatLog.create({
            userId,
            role,
            message,
            aiResponse,
        });

        res.status(200).json({
            success: true,
            reply: aiResponse,
            suggestions,
            link,
            linkText,
        });

    } catch (error) {
        console.error('Chat Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
