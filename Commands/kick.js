const isAdmin = require('../lib/isAdmin');

async function kickCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    const senderId = m.key.participant || m.key.remoteJid;
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        return await sock.sendMessage(chatId, { text: '❌ Veuillez me mettre administrateur.' }, { quoted: m });
    }

    if (!isSenderAdmin && !m.key.fromMe) {
        return await sock.sendMessage(chatId, { text: '❌ Seuls les administrateurs peuvent expulser.' }, { quoted: m });
    }

    let usersToKick = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        usersToKick.push(m.message.extendedTextMessage.contextInfo.participant);
    }
    
    if (usersToKick.length === 0) {
        return await sock.sendMessage(chatId, { text: '❌ Mentionnez l\'utilisateur à expulser ou répondez à son message.' }, { quoted: m });
    }

    try {
        await sock.groupParticipantsUpdate(chatId, usersToKick, "remove");
        await sock.sendMessage(chatId, { text: '✅ Utilisateur(s) expulsé(s) avec succès.' });
    } catch (error) {
        await sock.sendMessage(chatId, { text: '❌ Échec de l\'expulsion. Vérifiez mes permissions.' });
    }
}

module.exports = {
    name: 'kick',
    category: 'admin',
    execute: kickCommand
};