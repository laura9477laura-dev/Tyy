const db = require('../lib/database');
const isAdmin = require('../lib/isAdmin');
const { isSudo } = require('../lib/index');

async function unbanCommand(sock, m, args) {
    const chatId = m.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    const senderId = m.key.participant || m.key.remoteJid;

    if (isGroup) {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, { text: '❌ Veuillez me mettre administrateur pour utiliser cette commande.' }, { quoted: m });
        }
        if (!isSenderAdmin && !m.key.fromMe) {
            return await sock.sendMessage(chatId, { text: '❌ Seuls les administrateurs peuvent débannir.' }, { quoted: m });
        }
    } else {
        const senderIsSudo = await isSudo(senderId);
        if (!m.key.fromMe && !senderIsSudo) {
            return await sock.sendMessage(chatId, { text: '❌ Seul le propriétaire peut utiliser cette commande ici.' }, { quoted: m });
        }
    }

    let userToUnban = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                      m.message?.extendedTextMessage?.contextInfo?.participant;

    if (!userToUnban) {
        return await sock.sendMessage(chatId, { text: '❌ Mentionnez l\'utilisateur à débannir ou répondez à son message.' }, { quoted: m });
    }

    try {
        const bannedUsers = await db.get('banned', []);
        const index = bannedUsers.indexOf(userToUnban);
        if (index > -1) {
            bannedUsers.splice(index, 1);
            await db.set('banned', bannedUsers);
            await sock.sendMessage(chatId, { text: `✅ Utilisateur @${userToUnban.split('@')[0]} débanni avec succès.`, mentions: [userToUnban] }, { quoted: m });
        } else {
            await sock.sendMessage(chatId, { text: 'ℹ️ Cet utilisateur n\'est pas banni.' }, { quoted: m });
        }
    } catch (error) {
        await sock.sendMessage(chatId, { text: '❌ Erreur lors du débannissement.' }, { quoted: m });
    }
}

module.exports = {
    name: 'unban',
    category: 'admin',
    execute: unbanCommand
}; 