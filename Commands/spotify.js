const axios = require('axios');

async function spotifyCommand(sock, chatId, message) {
    try {
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            '';

        const used = (rawText || '').split(/\s+/)[0] || '.spotify';
        const query = rawText.slice(used.length).trim();

        if (!query) {
            await sock.sendMessage(chatId, { text: 'Utilisation : .spotify <chanson/artiste/mots-clés>\nExemple : .spotify Booba' }, { quoted: message });
            return;
        }

        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/search/spotify?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(apiUrl, { timeout: 20000, headers: { 'user-agent': 'Mozilla/5.0' } });

        if (!data?.status || !data?.result) {
            throw new Error('Aucun résultat trouvé sur Spotify.');
        }

        const r = data.result;
        const audioUrl = r.audio;
        if (!audioUrl) {
            await sock.sendMessage(chatId, { text: 'Aucun fichier audio téléchargeable trouvé.' }, { quoted: message });
            return;
        }

        const caption = `🎵 *${r.title || r.name || 'Titre inconnu'}*\n👤 ${r.artist || ''}\n⏱ ${r.duration || ''}\n🔗 ${r.url || ''}`.trim();

         if (r.thumbnails) {
            await sock.sendMessage(chatId, { image: { url: r.thumbnails }, caption }, { quoted: message });
        } else if (caption) {
            await sock.sendMessage(chatId, { text: caption }, { quoted: message });
        }
        
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${(r.title || r.name || 'track')}.mp3`
        }, { quoted: message });

    } catch (error) {
        console.error('[SPOTIFY] error:', error?.message || error);
        await sock.sendMessage(chatId, { text: '❌ Échec de la récupération Spotify. Veuillez réessayer plus tard.' }, { quoted: message });
    }
}

module.exports = spotifyCommand;
