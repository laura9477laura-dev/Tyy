const { ttdl } = require("ruhend-scraper");
const axios = require('axios');

async function tiktokCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        if (!text) {
            return await sock.sendMessage(chatId, { text: "Veuillez fournir un lien TikTok." });
        }

        const url = text.split(' ').slice(1).join(' ').trim();
        if (!url) {
            return await sock.sendMessage(chatId, { text: "Veuillez fournir un lien TikTok." });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        const apis = [
            `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`,
            `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
            `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`
        ];

        let videoUrl = null;
        let title = "TikTok Video";

        for (const apiUrl of apis) {
            try {
                const response = await axios.get(apiUrl, { timeout: 10000 });
                if (apiUrl.includes('siputzx')) {
                    if (response.data?.status && response.data?.data?.urls?.[0]) {
                        videoUrl = response.data.data.urls[0];
                        title = response.data.data.metadata?.title || title;
                        break;
                    }
                } else if (apiUrl.includes('tiklydown')) {
                    if (response.data?.video?.noWatermark) {
                        videoUrl = response.data.video.noWatermark;
                        title = response.data.title || title;
                        break;
                    }
                } else if (apiUrl.includes('tikwm')) {
                    if (response.data?.data?.play) {
                        videoUrl = "https://www.tikwm.com" + response.data.data.play;
                        title = response.data.data.title || title;
                        break;
                    }
                }
            } catch (e) {
                console.error(`API ${apiUrl} failed`);
            }
        }

        if (!videoUrl) {
            try {
                let downloadData = await ttdl(url);
                if (downloadData?.data?.[0]?.url) {
                    videoUrl = downloadData.data[0].url;
                }
            } catch (e) {}
        }

        if (videoUrl) {
            await sock.sendMessage(chatId, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: `*${title}*\n\n> *_Téléchargé par LIO 229_*`
            }, { quoted: m });
            await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
        } else {
            await sock.sendMessage(chatId, { text: "❌ Impossible de télécharger cette vidéo TikTok. Essayez un autre lien." }, { quoted: m });
        }

    } catch (error) {
        console.error('Error in tiktokCommand:', error);
        await sock.sendMessage(chatId, { text: "Une erreur est survenue lors du traitement." }, { quoted: m });
    }
}

module.exports = {
    name: 'tiktok',
    category: 'downloader',
    execute: tiktokCommand
}; 
 