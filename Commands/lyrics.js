const axios = require('axios');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, { 
            text: '🔍 Veuillez entrer le nom de la chanson ! Utilisation : *.lyrics <nom>*'
        },{ quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });

        const apis = [
            `https://api.siputzx.my.id/api/s/lyrics?query=${encodeURIComponent(songTitle)}`,
            `https://api.ryzendesu.vip/api/search/lyrics?query=${encodeURIComponent(songTitle)}`
        ];

        let lyrics = null;
        for (const api of apis) {
            try {
                const response = await axios.get(api);
                if (response.data?.result?.lyrics || response.data?.data?.lyrics) {
                    lyrics = response.data.result?.lyrics || response.data.data?.lyrics;
                    break;
                }
            } catch (e) {}
        }

        if (!lyrics) {
            await sock.sendMessage(chatId, {
                text: `❌ Désolé, je n'ai pas trouvé les paroles de "${songTitle}".`
            },{ quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: lyrics }, { quoted: message });
    } catch (error) {
        console.error('Error in lyrics command:', error);
        await sock.sendMessage(chatId, { text: `❌ Une erreur est survenue.` },{ quoted: message });
    }
}

module.exports = { lyricsCommand };
