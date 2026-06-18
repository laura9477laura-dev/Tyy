const fs = require('fs');
const path = require('path');
const axios = require('axios');
const settings = require('../settings');

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

const chatMemory = {
    messages: new Map(),
    userInfo: new Map()
};

function loadUserGroupData() {
    try {
        return JSON.parse(fs.readFileSync(USER_GROUP_DATA));
    } catch (error) {
        return { groups: [], chatbot: {} };
    }
}

function saveUserGroupData(data) {
    try {
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {}
}

async function handleChatbotCommand(sock, chatId, message, match) {
    const data = loadUserGroupData();
    const senderId = message.key.participant || message.key.remoteJid;

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `*CONFIGURATION CHATBOT*\n\n*.chatbot on*\nActiver le chatbot\n*.chatbot off*\nDésactiver le chatbot`,
            quoted: message
        });
    }

    if (match === 'on') {
        data.chatbot[chatId] = true;
        saveUserGroupData(data);
        return sock.sendMessage(chatId, { text: '✅ Chatbot activé pour ce groupe.', quoted: message });
    }

    if (match === 'off') {
        delete data.chatbot[chatId];
        saveUserGroupData(data);
        return sock.sendMessage(chatId, { text: '❌ Chatbot désactivé.', quoted: message });
    }
}

async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    const data = loadUserGroupData();
    if (!data.chatbot[chatId]) return;

    const botNumber = sock.user.id.split(':')[0];
    const isBotMentioned = userMessage.includes(`@${botNumber}`) || (message.message?.extendedTextMessage?.contextInfo?.participant?.includes(botNumber));

    if (!isBotMentioned) return;

    let cleanedMessage = userMessage.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();

    if (!chatMemory.messages.has(senderId)) {
        chatMemory.messages.set(senderId, []);
    }

    const history = chatMemory.messages.get(senderId);
    history.push(cleanedMessage);
    if (history.length > 10) history.shift();

    try {
        const prompt = `Tu es LIO 229, un humain réel discutant sur WhatsApp. Sois cool, direct, et utilise un ton amical ou sauvage selon l'interlocuteur. Pas de réponses robotiques. Garde tes réponses courtes (1-2 lignes). Historique : ${history.join('\n')}`;

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.0-flash-exp:free',
            messages: [{ role: 'system', content: prompt }, { role: 'user', content: cleanedMessage }]
        }, {
            headers: {
                'Authorization': `Bearer ${settings.openRouterKey}`,
                'Content-Type': 'application/json'
            }
        });

        const answer = response.data?.choices?.[0]?.message?.content;
        if (answer) {
            await sock.sendMessage(chatId, { text: answer }, { quoted: message });
        }
    } catch (error) {
        console.error('Chatbot AI Error:', error.message);
    }
}

module.exports = {
    handleChatbotCommand,
    handleChatbotResponse
}; 
 