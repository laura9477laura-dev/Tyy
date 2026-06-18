const isAdmin = require('../lib/isAdmin');

async function unmuteCommand(sock, m, args) {
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
        await sock.groupSettingUpdate(chatId, 'not_announcement');
        await sock.sendMessage(chatId, { text: '✅ Le groupe a été ouvert. Tout le monde peut envoyer des messages.' }, { quoted: m });
    } catch (error) {
        await sock.sendMessage(chatId, { text: '❌ Erreur lors de l\'ouverture du groupe.' }, { quoted: m });
    }
}

module.exports = {
    name: 'unmute',
    category: 'admin',
    execute: unmuteCommand
};
