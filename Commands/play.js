const yts = require('yt-search');
const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');

async function playCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    try {
        const searchQuery = args.join(' ').trim();
        
        if (!searchQuery) {
            return await sock.sendMessage(chatId, { 
                text: "Quelle musique souhaitez-vous télécharger ?"
            }, { quoted: m });
        }

        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: "Aucun résultat trouvé !"
            });
        }

        await sock.sendMessage(chatId, {
            text: "_Téléchargement en cours..._"
        });

        const video = videos[0];
        const urlYt = video.url;
        const title = video.title;
        const tempPath = path.join(__dirname, `../tmp/${Date.now()}.mp3`);

        try {
            // Tentative avec yt-dlp
            await execAsync(`yt-dlp -f "ba" -x --audio-format mp3 -o "${tempPath}" "${urlYt}"`);
            
            if (fs.existsSync(tempPath)) {
                await sock.sendMessage(chatId, {
                    audio: fs.readFileSync(tempPath),
                    mimetype: "audio/mpeg",
                    fileName: `${title}.mp3`
                }, { quoted: m });
                
                fs.unlinkSync(tempPath);
                return;
            }
        } catch (ytError) {
            console.error('yt-dlp error:', ytError.message);
        }

        // Fallback sur l'API externe
        const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`);
        const data = response.data;

        if (!data || !data.status || !data.result || !data.result.downloadUrl) {
            return await sock.sendMessage(chatId, { 
                text: "Échec du téléchargement via l'API. Veuillez réessayer plus tard."
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, {
            audio: { url: data.result.downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        }, { quoted: m });

    } catch (error) {
        console.error('Erreur dans playCommand:', error);
        await sock.sendMessage(chatId, { 
            text: "Le téléchargement a échoué. Veuillez réessayer plus tard."
        }, { quoted: m });
    }
}

module.exports = {
    name: 'play',
    aliases: ['song'],
    category: 'downloader',
    execute: playCommand
}; 