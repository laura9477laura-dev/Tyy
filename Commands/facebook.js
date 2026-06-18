const axios = require('axios');

async function facebookCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const url = text.split(' ').slice(1).join(' ').trim();

        if (!url) {
            return await sock.sendMessage(chatId, { 
                text: "Veuillez fournir un lien Facebook.\nExemple : .fb https://www.facebook.com/..."
            }, { quoted: message });
        }

        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            return await sock.sendMessage(chatId, { text: "Lien Facebook invalide." }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        const apis = [
            `https://api.hanggts.xyz/download/facebook?url=${encodeURIComponent(url)}`,
            `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`
        ];

        let videoUrl = null;
        let title = "Facebook Video";

        for (const apiUrl of apis) {
            try {
                const response = await axios.get(apiUrl, { timeout: 15000 });
                const data = response.data;
                if (data.status) {
                    if (data.result?.media) {
                        videoUrl = data.result.media.video_hd || data.result.media.video_sd;
                        title = data.result.info?.title || title;
                        break;
                    } else if (data.data?.url) {
                        videoUrl = data.data.url;
                        title = data.data.title || title;
                        break;
                    }
                }
            } catch (e) {}
        }

        if (videoUrl) {
            await sock.sendMessage(chatId, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: `*${title}*\n\n> *_Téléchargé par LIO 229_*`
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } else {
            await sock.sendMessage(chatId, { text: "❌ Échec du téléchargement Facebook. Le lien est peut-être privé." });
        }

    } catch (error) {
        console.error('Error in Facebook command:', error);
        await sock.sendMessage(chatId, { text: "Une erreur est survenue." });
    }
}

module.exports = facebookCommand; 
 