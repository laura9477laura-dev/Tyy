const settings = require('../settings');

/**
 * Anti-Ban Service
 * Focuses on risk mitigation, behavioral simulation, and malicious payload filtering.
 */
class AntiBan {
    constructor() {
        this.messageLog = new Map(); // Track message frequency per JID
        this.lastMessageTime = 0;
        this.MIN_DELAY = 500; // 0.5s minimum between any message
        this.MAX_MESSAGES_PER_MINUTE = 80; // Increased from 60
    }

    /**
     * Checks if a message contains malicious "virtex" or "binary" payloads
     */
    isMalicious(text) {
        if (!text) return false;
        
        // Check for extreme length (common in virtex)
        if (text.length > 40000) return true; // Increased from 25k

        // Check for specific invisible or RTL character abuse
        const maliciousPatterns = [
            /[\u202e\u202d\u200e\u200f]/g, // Bidirectional overrides
            /[\u0300-\u036f]{150,}/,        // Massive Zalgo/diacritics (increased from 100)
            /\u0000/g                      // Null bytes
        ];

        return maliciousPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Simulates human behavior by adding a random delay
     */
    async simulateHumanDelay() {
        const now = Date.now();
        const timeSinceLast = now - this.lastMessageTime;
        
        if (timeSinceLast < this.MIN_DELAY) {
            const extraDelay = (this.MIN_DELAY - timeSinceLast) + Math.floor(Math.random() * 300);
            await new Promise(resolve => setTimeout(resolve, extraDelay));
        }
        
        this.lastMessageTime = Date.now();
    }

    /**
     * Rate limits the bot to prevent spam detection by WhatsApp
     */
    shouldLimit(jid) {
        const now = Date.now();
        const log = this.messageLog.get(jid) || [];
        
        // Keep only messages from the last 60 seconds
        const recentMessages = log.filter(timestamp => now - timestamp < 60000);
        recentMessages.push(now);
        this.messageLog.set(jid, recentMessages);

        return recentMessages.length > this.MAX_MESSAGES_PER_MINUTE;
    }

    /**
     * Safety check before sending a message
     */
    async preSendCheck(sock, chatId, content) {
        if (this.shouldLimit(chatId)) {
            console.warn(`[ANTIBAN] Rate limiting active for ${chatId}`);
            return false;
        }

        await this.simulateHumanDelay();
        return true;
    }
}

module.exports = new AntiBan();
