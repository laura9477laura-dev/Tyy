const axios = require('axios');

async function memeCommand(sock, chatId, message) {
    try {
        const response = await axios.get('https://meme-api.com/gimme');
        if (response.data && response.data.url) {
            await sock.sendMessage(chatId, { 
                image: { url: response.data.url },
                caption: "😂 Voici un meme pour vous !"
            },{ quoted: message});
        } else {
            throw new Error('Échec de la récupération du meme');
        }
    } catch (error) {
        console.error('Error in meme command:', error);
        await sock.sendMessage(chatId, { text: '❌ Échec de la récupération du meme.' },{ quoted: message });
    }
}

module.exports = memeCommand;
