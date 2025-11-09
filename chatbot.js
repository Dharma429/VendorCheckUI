const readline = require('readline');
const axios = require('axios');

class CompanyChatbot {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.conversationState = {
            waitingForCompanyName: true,
            waitingForFENumber: false,
            companyName: null,
            feNumber: null
        };
    }

    start() {
        console.log('🤖 Welcome to Company Information Bot!');
        console.log('=' .repeat(40));
        this.askCompanyName();
    }

    askCompanyName() {
        this.rl.question('🏢 Please enter the company name: ', (companyName) => {
            if (!companyName.trim()) {
                console.log('❌ Company name cannot be empty. Please try again.');
                this.askCompanyName();
                return;
            }

            this.conversationState.companyName = companyName.trim();
            this.conversationState.waitingForCompanyName = false;
            this.conversationState.waitingForFENumber = true;
            
            this.askFENumber();
        });
    }

    askFENumber() {
        this.rl.question('🔢 Please enter the FE Number: ', async (feNumber) => {
            if (!feNumber.trim()) {
                console.log('❌ FE Number cannot be empty. Please try again.');
                this.askFENumber();
                return;
            }

            this.conversationState.feNumber = feNumber.trim();
            this.conversationState.waitingForFENumber = false;

            console.log('\n⏳ Processing your request...');
            await this.connectToAPI();
        });
    }

   async connectToAPI() {
    try {
        // Build URL with query parameters for GET request
        const apiUrl = `http://localhost:3001/fill-form?businessName=${encodeURIComponent(this.conversationState.companyName)}&feiNumber=${encodeURIComponent(this.conversationState.feNumber)}`;
        
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

        console.log('\n✅ API Response Received:');
        console.log('='.repeat(40));
        console.log('📋 Response Status:', response.status);
        console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
        
        this.askForAnotherSearch();

    } catch (error) {
        console.error('\n❌ API Connection Failed:');
        
        if (error.response) {
            // API responded with error status
            console.log('📡 API Response Error:', error.response.status);
            console.log('📄 Error Data:', error.response.data);
        } else if (error.request) {
            // No response received
            console.log('📡 No response from API. Please check your connection.');
        } else {
            // Other errors
            console.log('📡 Error:', error.message);
        }

        this.askForRetry();
    }
}
    askForRetry() {
        this.rl.question('\n🔄 Would you like to try again? (yes/no): ', (answer) => {
            if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                this.resetConversation();
                this.askCompanyName();
            } else {
                console.log('👋 Thank you for using Company Information Bot!');
                this.rl.close();
            }
        });
    }

    askForAnotherSearch() {
        this.rl.question('\n🔍 Would you like to search for another company? (yes/no): ', (answer) => {
            if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                this.resetConversation();
                this.askCompanyName();
            } else {
                console.log('👋 Thank you for using Company Information Bot!');
                this.rl.close();
            }
        });
    }

    resetConversation() {
        this.conversationState = {
            waitingForCompanyName: true,
            waitingForFENumber: false,
            companyName: null,
            feNumber: null
        };
    }

    close() {
        this.rl.close();
    }
}

// Export the class
module.exports = CompanyChatbot;

// Start the chatbot if this file is run directly
if (require.main === module) {
    const chatbot = new CompanyChatbot();
    chatbot.start();
}