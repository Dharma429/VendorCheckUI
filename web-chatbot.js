const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Store conversation state (in production, use a database)
const sessions = new Map();

class WebChatbot {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.state = {
            step: 'company_name',
            companyName: null,
            feNumber: null
        };
    }

    processMessage(message) {
        switch (this.state.step) {
            case 'company_name':
                if (!message.trim()) {
                    return {
                        response: '❌ Company name cannot be empty. Please enter the company name:',
                        step: 'company_name'
                    };
                }
                this.state.companyName = message.trim();
                this.state.step = 'fe_number';
                return {
                    response: '🔢 Please enter the FE Number:',
                    step: 'fe_number'
                };

            case 'fe_number':
                if (!message.trim()) {
                    return {
                        response: '❌ FE Number cannot be empty. Please enter the FE Number:',
                        step: 'fe_number'
                    };
                }
                this.state.feNumber = message.trim();
                this.state.step = 'processing';
                return {
                    response: '⏳ Processing your request...',
                    step: 'processing',
                    shouldCallAPI: true
                };

            default:
                return {
                    response: '🤖 How can I help you? Please start with a company name.',
                    step: 'company_name'
                };
        }
    }

    async callAPI() {
        try {

              const apiUrl = `http://localhost:3001/fill-form?businessName=${encodeURIComponent(this.state.companyName)}&feiNumber=${encodeURIComponent(this.state.feNumber)}`;
        
        console.log(`📡 Connecting to API: ${apiUrl}`);

        // Make API call - using GET instead of POST
        const response = await axios.get(apiUrl, {
            headers: {
                'Content-Type': 'application/json',
                // Add any required headers for your API
                // 'Authorization': 'Bearer your-token-here'
            },
            timeout: 1000000 // 10 seconds timeout
        });
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.response?.status
            };
        }
    }

    reset() {
        this.state = {
            step: 'company_name',
            companyName: null,
            feNumber: null
        };
    }
}



// API Routes
app.post('/api/chat', async (req, res) => {
    const { message, sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get or create session
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, new WebChatbot(sessionId));
    }

    const chatbot = sessions.get(sessionId);

    try {
        const result = chatbot.processMessage(message);

        if (result.shouldCallAPI) {
            // Call API and then respond
            const apiResult = await chatbot.callAPI();
            
            if (apiResult.success) {
                result.response = `✅ API Call Successful!\n\n` +
                                `🏢 Company: ${chatbot.state.companyName}\n` +
                                `🔢 FE Number: ${chatbot.state.feNumber}\n` +
                                `📊 API Response: ${JSON.stringify(apiResult.data, null, 2)}\n\n` +
                                `🔍 Would you like to search for another company? (Type "yes" to continue)`;
                result.step = 'complete';
            } else {
                result.response = `❌ API Call Failed: ${apiResult.error}\n\n` +
                                `🔄 Would you like to try again? (Type "yes" to retry)`;
                result.step = 'error';
            }
        }

        // Reset if user wants to continue
        if (result.step === 'complete' || result.step === 'error') {
            if (message.toLowerCase() === 'yes') {
                chatbot.reset();
                result.response = '🏢 Please enter the company name:';
                result.step = 'company_name';
            }
        }

        res.json({
            response: result.response,
            step: result.step,
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({
            response: '❌ An error occurred. Please try again.',
            step: 'error',
            sessionId: sessionId
        });
    }
});

app.post('/api/chat/reset', (req, res) => {
    const { sessionId } = req.body;
    if (sessionId && sessions.has(sessionId)) {
        sessions.get(sessionId).reset();
    }
    res.json({ success: true });
});

// Serve HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🤖 Web Chatbot running on http://localhost:${PORT}`);
});

module.exports = app;