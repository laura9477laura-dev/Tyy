const isAdmin = require('../lib/isAdmin');

async function muteCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    const senderId = m.key.participant || m.key.remoteJid;
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    
    if (!isBotAdmin) {
        return await sock.sendMessage(chatId, { text: '❌ Veuillez me mettre administrateur.' }, { quoted: m });
    }

    if (!isSenderAdmin && !m.key.fromMe) {
        return await sock.sendMessage(chatId, { text: '❌ Seuls les administrateurs peuvent utiliser cette commande.' }, { quoted: m });
    }

    try {
        await sock.groupSettingUpdate(chatId, 'announcement');
        await sock.sendMessage(chatId, { text: '✅ Groupe fermé. Seuls les administrateurs peuvent envoyer des messages.' }, { quoted: m });
    } catch (error) {
        await sock.sendMessage(chatId, { text: '❌ Erreur lors de la fermeture du groupe.' }, { quoted: m });
    }
}

module.exports = {
    name: 'mute',
    category: 'admin',
    execute: muteCommand
};