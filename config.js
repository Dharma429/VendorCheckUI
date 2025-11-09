module.exports = {
    // API Configuration
    api: {
        baseURL: 'http://192.168.1.185:3001/fill-form/',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': 'Bearer your-api-token'
        }
    },

    // Chatbot Configuration
    chatbot: {
        maxRetries: 3,
        retryDelay: 1000,
        sessionTimeout: 30 * 60 * 1000 // 30 minutes
    },

    // Validation Rules
    validation: {
        companyName: {
            minLength: 2,
            maxLength: 100
        },
        feNumber: {
            pattern: /^[A-Za-z0-9\-_]+$/, // Alphanumeric, dash, underscore
            minLength: 3,
            maxLength: 20
        }
    }
};