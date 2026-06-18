const axios = require('axios');
const settings = require('../settings');

async function aiCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    try {
        const query = args.join(' ').trim();
        if (!query) {
            return await sock.sendMessage(chatId, { text: "Posez-moi une question !\nExemple : .ai comment vas-tu ?" }, { quoted: m });
        }

        await sock.sendMessage(chatId, { react: { text: '🤖', key: m.key } });

        try {
            const apiKey = settings.openRouterKey;
            if (!apiKey) {
                return await sock.sendMessage(chatId, { text: "❌ Clé API AI non configurée. Contactez le propriétaire." }, { quoted: m });
            }

            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [{ role: 'user', content: query }]
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const answer = response.data?.choices?.[0]?.message?.content;
            if (answer) {
                await sock.sendMessage(chatId, { text: answer }, { quoted: m });
            } else {
                throw new Error('Réponse vide');
            }
        } catch (error) {
            console.error('OpenRouter Error:', error.message);
            await sock.sendMessage(chatId, { text: "❌ Désolé, je ne peux pas répondre pour le moment. Réessayez plus tard." }, { quoted: m });
        }
    } catch (error) {
        console.error('AI Command Error:', error);
        await sock.sendMessage(chatId, { text: "❌ Une erreur est survenue." }, { quoted: m });
    }
}

module.exports = {
    name: 'ai',
    category: 'ai',
    execute: aiCommand
}; 