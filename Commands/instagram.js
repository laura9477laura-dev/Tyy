const { igdl } = require("ruhend-scraper");

async function instagramCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        if (!text) {
            return await sock.sendMessage(chatId, { text: "Veuillez fournir un lien Instagram." });
        }

        const url = text.split(' ').slice(1).join(' ').trim() || text;
        const instagramPatterns = [/instagram\.com\//, /instagr\.am\//];
        if (!instagramPatterns.some(pattern => pattern.test(url))) {
            return await sock.sendMessage(chatId, { text: "Lien Instagram invalide." });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        let downloadData;
        try {
            downloadData = await igdl(url);
        } catch (e) {
            console.error('igdl failed:', e);
        }
        
        if (!downloadData?.data || downloadData.data.length === 0) {
            return await sock.sendMessage(chatId, { text: "❌ Aucun média trouvé. Le compte est peut-être privé ou le lien est invalide." });
        }

        const mediaToDownload = downloadData.data.slice(0, 5); // Limiter à 5 pour éviter le spam
        
        for (const media of mediaToDownload) {
            try {
                const isVideo = media.url.includes('.mp4') || media.type === 'video';
                if (isVideo) {
                    await sock.sendMessage(chatId, {
                        video: { url: media.url },
                        mimetype: "video/mp4",
                        caption: "> *_Téléchargé par LIO 229_*"
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, {
                        image: { url: media.url },
                        caption: "> *_Téléchargé par LIO 229_*"
                    }, { quoted: message });
                }
            } catch (e) {}
        }
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Error in Instagram command:', error);
        await sock.sendMessage(chatId, { text: "Une erreur est survenue." });
    }
}

module.exports = instagramCommand;
