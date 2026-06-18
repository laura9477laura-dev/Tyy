const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { toAudio } = require('../lib/converter');

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
async function getEliteProTechDownloadByUrl(youtubeUrl) {
	const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	if (res?.data?.success && res?.data?.downloadURL) {
		return {
			download: res.data.downloadURL,
			title: res.data.title
		};
	}
	throw new Error('EliteProTech a échoué');
}

async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        if (!text) {
            await sock.sendMessage(chatId, { text: 'Utilisation : .song <nom de la chanson ou lien YouTube>' }, { quoted: message });
            return;
        }

        let video;
        if (text.includes('youtube.com') || text.includes('youtu.be')) {
			video = { url: text };
        } else {
			const search = await yts(text);
			if (!search || !search.videos.length) {
                await sock.sendMessage(chatId, { text: 'Aucun résultat trouvé.' }, { quoted: message });
                return;
            }
			video = search.videos[0];
        }

        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail || 'https://i.ytimg.com/vi/default.jpg' },
            caption: `🎵 Téléchargement : *${video.title || 'Musique'}*\n⏱ Durée : ${video.timestamp || 'Inconnue'}`
        }, { quoted: message });

        const tempPath = path.join(__dirname, `../tmp/${Date.now()}.mp3`);
        try {
            // Tentative avec yt-dlp
            await execAsync(`yt-dlp -f "ba" -x --audio-format mp3 -o "${tempPath}" "${video.url}"`);
            
            if (fs.existsSync(tempPath)) {
                await sock.sendMessage(chatId, {
                    audio: fs.readFileSync(tempPath),
                    mimetype: "audio/mpeg",
                    fileName: `${video.title || 'musique'}.mp3`
                }, { quoted: message });
                
                fs.unlinkSync(tempPath);
                return;
            }
        } catch (ytError) {
            console.error('yt-dlp error:', ytError.message);
        }

		// Fallback APIs
		try {
			const audioData = await getEliteProTechDownloadByUrl(video.url);
			await sock.sendMessage(chatId, {
				audio: { url: audioData.download },
				mimetype: 'audio/mpeg',
				fileName: `${(audioData.title || video.title || 'musique')}.mp3`,
				ptt: false
			}, { quoted: message });
		} catch (apiErr) {
			throw new Error('Toutes les sources ont échoué.');
		}

    } catch (err) {
        console.error('Song command error:', err);
        await sock.sendMessage(chatId, { 
            text: `❌ Échec du téléchargement : ${err.message}` 
        }, { quoted: message });
    }
}

module.exports = songCommand;