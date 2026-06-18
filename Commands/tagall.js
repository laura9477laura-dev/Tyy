const isAdmin = require('../lib/isAdmin');

async function tagAllCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    const senderId = m.key.participant || m.key.remoteJid;
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, { text: '❌ Veuillez me mettre administrateur.' }, { quoted: m });
        }

        if (!isSenderAdmin && !m.key.fromMe) {
            return await sock.sendMessage(chatId, { text: '❌ Seuls les administrateurs peuvent utiliser cette commande.' }, { quoted: m });
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;

        if (!participants || participants.length === 0) {
            return await sock.sendMessage(chatId, { text: '❌ Aucun participant trouvé.' }, { quoted: m });
        }

        let messageText = '🔊 *Appel à tous :*\n\n';
        participants.forEach(participant => {
            messageText += `@${participant.id.split('@')[0]}\n`;
        });

        await sock.sendMessage(chatId, {
            text: messageText,
            mentions: participants.map(p => p.id)
        }, { quoted: m });

    } catch (error) {
        console.error('Error in tagall command:', error);
        await sock.sendMessage(chatId, { text: '❌ Échec de l\'appel.' }, { quoted: m });
    }
}

module.exports = {
    name: 'tagall',
    category: 'admin',
    execute: tagAllCommand
};
