const axios = require('axios');
const yts = require('yt-search');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}

// EliteProTech API
async function getEliteProTechVideoByUrl(youtubeUrl) {
    const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp4`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.success && res?.data?.downloadURL) {
        return {
            download: res.data.downloadURL,
            title: res.data.title
        };
    }
    throw new Error('EliteProTech a retourné une erreur');
}

async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            await sock.sendMessage(chatId, { text: 'Quelle vidéo souhaitez-vous télécharger ?' }, { quoted: message });
            return;
        }

        let videoUrl = '';
        let videoTitle = '';
        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            videoUrl = searchQuery;
        } else {
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, { text: 'Aucune vidéo trouvée !' }, { quoted: message });
                return;
            }
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
        }

        await sock.sendMessage(chatId, { text: '_Téléchargement de la vidéo en cours..._' });

        const tempPath = path.join(__dirname, `../tmp/${Date.now()}.mp4`);
        try {
            // Tentative avec yt-dlp
            await execAsync(`yt-dlp -f "mp4" -o "${tempPath}" "${videoUrl}"`);

            if (fs.existsSync(tempPath)) {
                await sock.sendMessage(chatId, {
                    video: fs.readFileSync(tempPath),
                    mimetype: 'video/mp4',
                    caption: `*${videoTitle || 'Vidéo'}*\n\n> *_Téléchargé par LIO 229_*`
                }, { quoted: message });

                fs.unlinkSync(tempPath);
                return;
            }
        } catch (ytError) {
            console.error('yt-dlp error:', ytError.message);
        }

        // Fallback sur API
        try {
            const videoData = await getEliteProTechVideoByUrl(videoUrl);
            await sock.sendMessage(chatId, {
                video: { url: videoData.download },
                mimetype: 'video/mp4',
                caption: `*${videoData.title || videoTitle || 'Vidéo'}*\n\n> *_Téléchargé par LIO 229_*`
            }, { quoted: message });
        } catch (apiErr) {
            throw new Error('Toutes les sources de téléchargement ont échoué.');
        }

    } catch (error) {
        console.error('Erreur videoCommand:', error);
        await sock.sendMessage(chatId, { text: `❌ Échec du téléchargement : ${error.message}` }, { quoted: message });
    }
}

module.exports = videoCommand; 
 