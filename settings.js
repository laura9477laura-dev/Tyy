require('dotenv').config();

const settings = {
    // Bot Info
    botName: process.env.BOT_NAME || "LIO 229",
    botOwner: process.env.BOT_OWNER || 'Evans',
    ownerNumber: process.env.OWNER_NUMBER || '',
    version: "1.1.0",
    description: "LIO 229 - Bot WhatsApp made in Bénin 🇧🇯",
    
    // Commands & Behavior
    prefix: process.env.PREFIX || '.',
    commandMode: process.env.MODE || "public",
    packname: process.env.PACK_NAME || 'LIO 229',
    author: process.env.PACK_AUTHOR || 'LIO 🇧🇯',
    
    // API Keys
    openRouterKey: process.env.OPENROUTER_KEY,
    giphyApiKey: process.env.GIPHY_API_KEY || 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
    
    // Performance & Storage
    maxStoreMessages: parseInt(process.env.MAX_STORE_MESSAGES) || 20,
    storeWriteInterval: parseInt(process.env.STORE_WRITE_INTERVAL) || 10000,
    
    // URLs
    updateZipUrl: "",
};

module.exports = settings;
