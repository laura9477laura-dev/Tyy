const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const db = require('../lib/database');

async function helpCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    const msgCountData = await db.get('messageCount', { isPublic: true });
    const currentMode = msgCountData.isPublic ? 'Public' : 'Privé';
    const prefix = settings.prefix || '.';

    const helpMessage = `
🌟 *${settings.botName || 'LIO 229'}* 🌟
_Bot WhatsApp Multi-fonctions_

📌 *Version* : ${settings.version}
👤 *Proprio* : ${settings.botOwner}
🌐 *Mode* : *${currentMode}*
⌨️ *Prefix* : *${prefix}*

--- 📜 *MENU DES COMMANDES* ---

🛠️ *GÉNÉRAL*
${prefix}help | ${prefix}menu - Afficher ce menu
${prefix}ping - Tester la latence
${prefix}alive - Statut du bot
${prefix}owner - Infos propriétaire
${prefix}jid - Obtenir le JID du groupe

📥 *TÉLÉCHARGEMENT*
${prefix}play <nom> - Musique (MP3)
${prefix}song <nom> - Musique (MP3)
${prefix}video <nom> - Vidéo (MP4)
${prefix}tiktok <lien> - Vidéo TikTok
${prefix}fb <lien> - Vidéo Facebook
${prefix}ig <lien> - Média Instagram
${prefix}spotify <nom> - Musique Spotify

🤖 *INTELLIGENCE ARTIFICIELLE*
${prefix}ai <question> - Chat avec LIO IA
${prefix}imagine <prompt> - Générer une image
${prefix}lyrics <nom> - Paroles de chanson

🎨 *AUTRES*
${prefix}sticker | ${prefix}s - Créer un sticker
${prefix}meme - Obtenir un meme
${prefix}quote - Citation aléatoire
${prefix}dare - Défi (Action)
${prefix}truth - Vérité

🛠️ *OUTILS*
${prefix}calc <calcul> - Calculatrice
${prefix}qr <texte/lien> - Générer un QR Code
${prefix}tts <texte> - Texte vers parole
${prefix}translate <lang> - Traduire texte

👮 *ADMINISTRATION*
${prefix}kick @user - Expulser
${prefix}ban @user - Bannir
${prefix}unban @user - Débannir
${prefix}promote @user - Promouvoir admin
${prefix}demote @user - Destituer admin
${prefix}mute <min> - Silence
${prefix}unmute - Rétablir parole
${prefix}tagall - Taguer tout le monde
${prefix}hidetag <msg> - Tag invisible

🔐 *PROPRIÉTAIRE*
${prefix}mode public/private
${prefix}setprefix <symbole> - Changer le préfixe
${prefix}clearsession - Nettoyer session
${prefix}cleartmp - Nettoyer fichiers temp
${prefix}autostatus on/off

----------------------------------
*LIO 229 - Fait avec ❤️ au Bénin 🇧🇯*`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption: helpMessage
            }, { quoted: m });
        } else {
            await sock.sendMessage(chatId, { text: helpMessage }, { quoted: m });
        }
    } catch (error) {
        await sock.sendMessage(chatId, { text: helpMessage }, { quoted: m });
    }
}

module.exports = {
    name: 'help',
    aliases: ['menu'],
    category: 'general',
    execute: helpCommand
};